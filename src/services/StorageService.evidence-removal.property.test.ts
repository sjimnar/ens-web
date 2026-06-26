import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import 'fake-indexeddb/auto';
import { StorageService } from './StorageService';
import type { ControlAuditState, EvidenceFile, EvidenceLink, ComplianceStatus } from '@/types';

/**
 * Property-based tests for evidence removal completeness
 *
 * **Validates: Requirements 3.5**
 *
 * Property 10: Evidence removal completeness
 * For any control with one or more evidence items, after removing a specific
 * evidence item, querying storage for that item's ID shall return null/undefined.
 */

describe('StorageService - Property 10: Evidence removal completeness', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    localStorage.clear();
  });

  afterEach(() => {
    indexedDB.deleteDatabase('ens-audit-db');
  });

  // ─── Generators ─────────────────────────────────────────────────────

  const controlIdArb = fc.stringMatching(/^[a-z][a-z0-9.]{0,19}$/);

  const complianceStatusArb = fc.constantFrom<ComplianceStatus>(
    'Pendiente',
    'En progreso',
    'Cumplido',
    'No aplica'
  );

  // Safe ISO date generator using integer timestamps
  const isoDateArb = fc.integer({ min: 1577836800000, max: 1893456000000 })
    .map(ts => new Date(ts).toISOString());

  const evidenceFileArb = fc.record({
    id: fc.uuid(),
    controlId: controlIdArb,
    filename: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    mimeType: fc.constantFrom(
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ),
    size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
    data: fc.uint8Array({ minLength: 1, maxLength: 256 }).map(arr => arr.buffer as ArrayBuffer),
    addedAt: isoDateArb,
  }) as fc.Arbitrary<EvidenceFile>;

  const evidenceLinkArb = fc.record({
    id: fc.uuid(),
    controlId: controlIdArb,
    url: fc.webUrl(),
    label: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    addedAt: isoDateArb,
  }) as fc.Arbitrary<EvidenceLink>;

  const controlAuditStateWithLinksArb = fc.record({
    controlId: controlIdArb,
    status: complianceStatusArb,
    comment: fc.string({ minLength: 0, maxLength: 200 }),
    evidenceLinks: fc.array(evidenceLinkArb, { minLength: 2, maxLength: 6 }),
  }) as fc.Arbitrary<ControlAuditState>;

  // ─── File evidence removal from IndexedDB ───────────────────────────

  describe('File evidence removal from IndexedDB', () => {
    it('after deleting a file, getFile returns null for that ID and other files remain', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(evidenceFileArb, { minLength: 2, maxLength: 4 }),
          fc.nat(),
          async (files, indexSeed) => {
            // Ensure unique IDs
            const uniqueFiles = files.reduce<EvidenceFile[]>((acc, f) => {
              if (!acc.find(x => x.id === f.id)) acc.push(f);
              return acc;
            }, []);

            if (uniqueFiles.length < 2) return; // Need at least 2 files

            // Save all files
            for (const file of uniqueFiles) {
              await service.saveFile(file);
            }

            // Pick one file to delete
            const deleteIndex = indexSeed % uniqueFiles.length;
            const fileToDelete = uniqueFiles[deleteIndex];

            // Delete the chosen file
            await service.deleteFile(fileToDelete.id);

            // Assert deleted file returns null
            const deleted = await service.getFile(fileToDelete.id);
            expect(deleted).toBeNull();

            // Assert all other files are still retrievable
            const remainingFiles = uniqueFiles.filter(f => f.id !== fileToDelete.id);
            for (const file of remainingFiles) {
              const retrieved = await service.getFile(file.id);
              expect(retrieved).not.toBeNull();
              expect(retrieved!.id).toBe(file.id);
              expect(retrieved!.filename).toBe(file.filename);
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);
  });

  // ─── Evidence link removal from ControlAuditState ───────────────────

  describe('Evidence link removal from ControlAuditState', () => {
    it('after removing an evidence link and saving, the removed link is not present', () => {
      fc.assert(
        fc.property(
          controlAuditStateWithLinksArb,
          fc.nat(),
          (state, indexSeed) => {
            // Ensure unique link IDs
            const uniqueLinks = state.evidenceLinks.reduce<EvidenceLink[]>((acc, link) => {
              if (!acc.find(x => x.id === link.id)) acc.push(link);
              return acc;
            }, []);

            if (uniqueLinks.length < 2) return; // Need at least 2 links

            const stateWithUniqueLinks: ControlAuditState = {
              ...state,
              evidenceLinks: uniqueLinks,
            };

            // Save the initial state
            service.saveControlState(stateWithUniqueLinks.controlId, stateWithUniqueLinks);

            // Pick one link to remove
            const removeIndex = indexSeed % uniqueLinks.length;
            const linkToRemove = uniqueLinks[removeIndex];

            // Remove the link and save updated state
            const updatedLinks = uniqueLinks.filter(l => l.id !== linkToRemove.id);
            const updatedState: ControlAuditState = {
              ...stateWithUniqueLinks,
              evidenceLinks: updatedLinks,
            };
            service.saveControlState(updatedState.controlId, updatedState);

            // Read back and assert the removed link is gone
            const retrieved = service.getControlState(updatedState.controlId);
            expect(retrieved).not.toBeNull();
            expect(retrieved!.evidenceLinks.find(l => l.id === linkToRemove.id)).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('after removing an evidence link, other links remain intact', () => {
      fc.assert(
        fc.property(
          controlAuditStateWithLinksArb,
          fc.nat(),
          (state, indexSeed) => {
            // Ensure unique link IDs
            const uniqueLinks = state.evidenceLinks.reduce<EvidenceLink[]>((acc, link) => {
              if (!acc.find(x => x.id === link.id)) acc.push(link);
              return acc;
            }, []);

            if (uniqueLinks.length < 2) return; // Need at least 2 links

            const stateWithUniqueLinks: ControlAuditState = {
              ...state,
              evidenceLinks: uniqueLinks,
            };

            // Save the initial state
            service.saveControlState(stateWithUniqueLinks.controlId, stateWithUniqueLinks);

            // Pick one link to remove
            const removeIndex = indexSeed % uniqueLinks.length;
            const linkToRemove = uniqueLinks[removeIndex];

            // Remove the link and save updated state
            const updatedLinks = uniqueLinks.filter(l => l.id !== linkToRemove.id);
            const updatedState: ControlAuditState = {
              ...stateWithUniqueLinks,
              evidenceLinks: updatedLinks,
            };
            service.saveControlState(updatedState.controlId, updatedState);

            // Read back and assert the remaining links are present
            const retrieved = service.getControlState(updatedState.controlId);
            expect(retrieved).not.toBeNull();
            for (const link of updatedLinks) {
              const found = retrieved!.evidenceLinks.find(l => l.id === link.id);
              expect(found).toBeDefined();
              expect(found!.url).toBe(link.url);
              expect(found!.label).toBe(link.label);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
