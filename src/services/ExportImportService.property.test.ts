import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ExportImportService } from './ExportImportService';
import type { NivelENS, ComplianceStatus, EvidenceLink, ControlAuditState, AuditState } from '@/types';

// ─── Generators ────────────────────────────────────────────────────────────────

const arbNivelENS: fc.Arbitrary<NivelENS> = fc.constantFrom('BÁSICO', 'MEDIO', 'ALTO');

const arbComplianceStatus: fc.Arbitrary<ComplianceStatus> = fc.constantFrom(
  'Pendiente',
  'En progreso',
  'Cumplido',
  'No aplica'
);

const arbISODate = fc.integer({
  min: new Date('2000-01-01').getTime(),
  max: new Date('2099-12-31').getTime(),
}).map((ts) => new Date(ts).toISOString());

const arbEvidenceLink: fc.Arbitrary<EvidenceLink> = fc.record({
  id: fc.uuid(),
  controlId: fc.stringMatching(/^[a-z]{2,3}\.[a-z]{1,4}\.\d{1,2}$/),
  url: fc.webUrl(),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  addedAt: arbISODate,
});

const arbControlAuditState: fc.Arbitrary<ControlAuditState> = fc.record({
  controlId: fc.stringMatching(/^[a-z]{2,3}\.[a-z]{1,4}\.\d{1,2}$/),
  status: arbComplianceStatus,
  comment: fc.string({ maxLength: 500 }),
  evidenceLinks: fc.array(arbEvidenceLink, { minLength: 0, maxLength: 5 }),
});

const arbAuditState: fc.Arbitrary<AuditState> = fc.record({
  level: arbNivelENS,
  controls: fc.dictionary(
    fc.stringMatching(/^[a-z]{2,3}\.[a-z]{1,4}\.\d{1,2}$/),
    arbControlAuditState,
    { minKeys: 0, maxKeys: 10 }
  ),
  lastModified: arbISODate,
});

const arbDate = fc.integer({
  min: new Date('2000-01-01').getTime(),
  max: new Date('2099-12-31').getTime(),
}).map((ts) => new Date(ts));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ExportImportService - Property Tests', () => {
  const service = new ExportImportService();

  /**
   * Property 15: Export/Import round-trip
   *
   * For any valid AuditState, exporting to JSON and then importing the
   * resulting file shall produce an ExportData equivalent to the original
   * (same level, same statuses, same comments, same evidence links).
   *
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  describe('Property 15: Export/Import round-trip', () => {
    it('export then import preserves level and controls', () => {
      fc.assert(
        fc.property(arbAuditState, (state) => {
          // 1. Export
          const exported = service.exportAuditData(state);

          // 2. Serialize to JSON
          const json = JSON.stringify(exported);

          // 3. Parse back
          const imported = service.parseImportFile(json);

          // 4. Assertions
          expect(imported).not.toBeNull();
          expect(imported!.level).toBe(state.level);
          expect(imported!.controls).toEqual(state.controls);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Export filename format
   *
   * For any valid NivelENS and Date, the generated export filename shall
   * contain the level name (lowercased, no accents) and the date in
   * YYYY-MM-DD format.
   *
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  describe('Property 16: Export filename format', () => {
    const levelMapping: Record<NivelENS, string> = {
      'BÁSICO': 'basico',
      'MEDIO': 'medio',
      'ALTO': 'alto',
    };

    it('filename matches expected pattern with correct level and date', () => {
      fc.assert(
        fc.property(arbNivelENS, arbDate, (level, date) => {
          const filename = service.generateFilename(level, date);

          // Assert overall pattern
          const pattern = /^auditoria-ens-(basico|medio|alto)-(\d{4}-\d{2}-\d{2})\.json$/;
          expect(filename).toMatch(pattern);

          // Assert level part is correctly normalized
          const expectedLevel = levelMapping[level];
          expect(filename).toContain(`-${expectedLevel}-`);

          // Assert date part matches the input date
          const expectedDate = date.toISOString().slice(0, 10);
          expect(filename).toContain(`-${expectedDate}.json`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
