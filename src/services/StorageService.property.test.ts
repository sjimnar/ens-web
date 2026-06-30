import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import 'fake-indexeddb/auto';
import { StorageService } from './StorageService';
import type { ComplianceStatus, ControlAuditState, EvidenceFile, NivelENS } from '@/types';

/**
 * Property-based tests for StorageService
 *
 * Validates: Requirements 1.3, 4.2, 4.3, 5.2, 5.3, 7.1, 7.2
 */

describe('StorageService - Property Tests', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up IndexedDB between tests
    indexedDB.deleteDatabase('ens-audit-db');
  });

  // ─── Generators ─────────────────────────────────────────────────────

  const nivelENSArb = fc.constantFrom<NivelENS>('BÁSICO', 'MEDIO', 'ALTO');

  const complianceStatusArb = fc.constantFrom<ComplianceStatus>(
    'Pendiente',
    'En progreso',
    'Cumplido',
    'No aplica'
  );

  // Control IDs: non-empty strings that mimic ENS control IDs
  const controlIdArb = fc.stringMatching(/^[a-z][a-z0-9.]{0,19}$/);

  // Comment strings: arbitrary unicode strings (including empty)
  const commentArb = fc.string({ minLength: 0, maxLength: 500 });

  // Evidence file generator (≤5MB)
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
    size: fc.integer({ min: 1, max: 30 * 1024 * 1024 }), // ≤30MB
    data: fc.uint8Array({ minLength: 1, maxLength: 1024 }).map(arr => arr.buffer as ArrayBuffer),
    addedAt: fc.date({ min: new Date('2020-01-01T00:00:00.000Z'), max: new Date('2030-01-01T00:00:00.000Z') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  }) as fc.Arbitrary<EvidenceFile>;

  // ─── Property 2: Level persistence round-trip ───────────────────────

  /**
   * **Validates: Requirements 1.3, 7.1**
   *
   * For any valid NivelENS value, saving it to localStorage and then
   * reading it back shall produce the same level value.
   */
  describe('Property 2: Level persistence round-trip', () => {
    it('saving a level and reading it back produces the same value', () => {
      fc.assert(
        fc.property(nivelENSArb, (level) => {
          service.saveLevel(level);
          const retrieved = service.getLevel();
          expect(retrieved).toBe(level);
        }),
        { numRuns: 100 }
      );
    });

    it('overwriting a level with a new one always returns the latest', () => {
      fc.assert(
        fc.property(nivelENSArb, nivelENSArb, (first, second) => {
          service.saveLevel(first);
          service.saveLevel(second);
          const retrieved = service.getLevel();
          expect(retrieved).toBe(second);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── Property 9: File evidence round-trip ───────────────────────────

  /**
   * **Validates: Requirements 3.3, 7.2**
   *
   * For any valid file (≤5MB), storing it in IndexedDB and retrieving it
   * by its ID shall produce a file with identical filename, mimeType, size,
   * and data content.
   */
  describe('Property 9: File evidence round-trip', () => {
    it('saving a file and retrieving it by ID produces identical data', async () => {
      await fc.assert(
        fc.asyncProperty(evidenceFileArb, async (file) => {
          await service.saveFile(file);
          const retrieved = await service.getFile(file.id);

          expect(retrieved).not.toBeNull();
          expect(retrieved!.id).toBe(file.id);
          expect(retrieved!.controlId).toBe(file.controlId);
          expect(retrieved!.filename).toBe(file.filename);
          expect(retrieved!.mimeType).toBe(file.mimeType);
          expect(retrieved!.size).toBe(file.size);
          expect(retrieved!.addedAt).toBe(file.addedAt);

          // Compare ArrayBuffer content byte-by-byte
          const originalBytes = new Uint8Array(file.data);
          const retrievedBytes = new Uint8Array(retrieved!.data);
          expect(retrievedBytes.length).toBe(originalBytes.length);
          for (let i = 0; i < originalBytes.length; i++) {
            expect(retrievedBytes[i]).toBe(originalBytes[i]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── Property 11: Comment persistence round-trip ────────────────────

  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any valid comment string and control ID, persisting the comment
   * and then reading it back shall return the identical string.
   */
  describe('Property 11: Comment persistence round-trip', () => {
    it('saving a comment in a control state and reading it back produces the same string', () => {
      fc.assert(
        fc.property(controlIdArb, commentArb, (controlId, comment) => {
          const state: ControlAuditState = {
            controlId,
            status: 'Pendiente',
            comment,
            evidenceLinks: [],
          };

          service.saveControlState(controlId, state);
          const retrieved = service.getControlState(controlId);

          expect(retrieved).not.toBeNull();
          expect(retrieved!.comment).toBe(comment);
        }),
        { numRuns: 100 }
      );
    });

    it('updating a comment preserves the new value', () => {
      fc.assert(
        fc.property(controlIdArb, commentArb, commentArb, (controlId, firstComment, secondComment) => {
          const state1: ControlAuditState = {
            controlId,
            status: 'Pendiente',
            comment: firstComment,
            evidenceLinks: [],
          };
          service.saveControlState(controlId, state1);

          const state2: ControlAuditState = {
            controlId,
            status: 'Pendiente',
            comment: secondComment,
            evidenceLinks: [],
          };
          service.saveControlState(controlId, state2);

          const retrieved = service.getControlState(controlId);
          expect(retrieved).not.toBeNull();
          expect(retrieved!.comment).toBe(secondComment);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── Property 12: Compliance status persistence round-trip ──────────

  /**
   * **Validates: Requirements 5.2, 5.3**
   *
   * For any valid ComplianceStatus value and control ID, persisting the
   * status and then reading it back shall return the identical status value.
   */
  describe('Property 12: Compliance status persistence round-trip', () => {
    it('saving a compliance status and reading it back produces the same value', () => {
      fc.assert(
        fc.property(controlIdArb, complianceStatusArb, (controlId, status) => {
          const state: ControlAuditState = {
            controlId,
            status,
            comment: '',
            evidenceLinks: [],
          };

          service.saveControlState(controlId, state);
          const retrieved = service.getControlState(controlId);

          expect(retrieved).not.toBeNull();
          expect(retrieved!.status).toBe(status);
        }),
        { numRuns: 100 }
      );
    });

    it('changing a status always reflects the latest value', () => {
      fc.assert(
        fc.property(
          controlIdArb,
          complianceStatusArb,
          complianceStatusArb,
          (controlId, firstStatus, secondStatus) => {
            const state1: ControlAuditState = {
              controlId,
              status: firstStatus,
              comment: '',
              evidenceLinks: [],
            };
            service.saveControlState(controlId, state1);

            const state2: ControlAuditState = {
              controlId,
              status: secondStatus,
              comment: '',
              evidenceLinks: [],
            };
            service.saveControlState(controlId, state2);

            const retrieved = service.getControlState(controlId);
            expect(retrieved).not.toBeNull();
            expect(retrieved!.status).toBe(secondStatus);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
