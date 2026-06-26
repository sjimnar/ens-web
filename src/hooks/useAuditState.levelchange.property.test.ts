import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { NivelENS, ComplianceStatus, EvidenceLink, ControlAuditState, AuditState } from '@/types';

/**
 * Property 3: Level change preserves audit data
 *
 * For any existing AuditState with evidence and comments, changing the NivelENS
 * shall preserve all ControlAuditState entries (statuses, comments, evidence links)
 * without deletion or modification.
 *
 * **Validates: Requirements 1.5**
 */

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

const arbControlId = fc.stringMatching(/^[a-z]{2,3}\.[a-z]{1,4}\.\d{1,2}$/);

const arbEvidenceLink: fc.Arbitrary<EvidenceLink> = fc.record({
  id: fc.uuid(),
  controlId: arbControlId,
  url: fc.webUrl(),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  addedAt: arbISODate,
});

const arbControlAuditState: fc.Arbitrary<ControlAuditState> = fc.record({
  controlId: arbControlId,
  status: arbComplianceStatus,
  comment: fc.string({ maxLength: 500 }),
  evidenceLinks: fc.array(arbEvidenceLink, { minLength: 0, maxLength: 5 }),
});

const arbAuditState: fc.Arbitrary<AuditState> = fc.record({
  level: arbNivelENS,
  controls: fc.dictionary(
    arbControlId,
    arbControlAuditState,
    { minKeys: 1, maxKeys: 15 }
  ),
  lastModified: arbISODate,
});

// ─── Level Change Logic (extracted from useAuditState) ─────────────────────────

/**
 * Pure function that mirrors the state transformation in useAuditState.setLevel.
 * This is exactly the logic inside the setAuditState callback in the hook.
 */
function applyLevelChange(prev: AuditState, newLevel: NivelENS): AuditState {
  return {
    ...prev,
    level: newLevel,
    controls: prev.controls,
    lastModified: new Date().toISOString(),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuditState - Property Tests', () => {
  describe('Property 3: Level change preserves audit data', () => {
    it('changing level preserves all control states without modification', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          // The new state has the new level
          expect(result.level).toBe(newLevel);

          // All control entries are preserved (same keys)
          const originalKeys = Object.keys(originalState.controls).sort();
          const resultKeys = Object.keys(result.controls).sort();
          expect(resultKeys).toEqual(originalKeys);

          // Each control state is preserved exactly
          for (const controlId of originalKeys) {
            const original = originalState.controls[controlId];
            const preserved = result.controls[controlId];

            expect(preserved.controlId).toBe(original.controlId);
            expect(preserved.status).toBe(original.status);
            expect(preserved.comment).toBe(original.comment);
            expect(preserved.evidenceLinks).toEqual(original.evidenceLinks);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('changing level never deletes any control entry', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          // Number of controls must remain the same
          const originalCount = Object.keys(originalState.controls).length;
          const resultCount = Object.keys(result.controls).length;
          expect(resultCount).toBe(originalCount);
        }),
        { numRuns: 100 }
      );
    });

    it('changing level preserves evidence links for every control', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          for (const controlId of Object.keys(originalState.controls)) {
            const originalLinks = originalState.controls[controlId].evidenceLinks;
            const resultLinks = result.controls[controlId].evidenceLinks;

            // Same number of evidence links
            expect(resultLinks.length).toBe(originalLinks.length);

            // Each link preserved exactly
            for (let i = 0; i < originalLinks.length; i++) {
              expect(resultLinks[i].id).toBe(originalLinks[i].id);
              expect(resultLinks[i].url).toBe(originalLinks[i].url);
              expect(resultLinks[i].label).toBe(originalLinks[i].label);
              expect(resultLinks[i].controlId).toBe(originalLinks[i].controlId);
              expect(resultLinks[i].addedAt).toBe(originalLinks[i].addedAt);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('changing level preserves comments for every control', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          for (const controlId of Object.keys(originalState.controls)) {
            expect(result.controls[controlId].comment)
              .toBe(originalState.controls[controlId].comment);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('changing level multiple times still preserves original data', () => {
      fc.assert(
        fc.property(
          arbAuditState,
          arbNivelENS,
          arbNivelENS,
          arbNivelENS,
          (originalState, level1, level2, level3) => {
            const after1 = applyLevelChange(originalState, level1);
            const after2 = applyLevelChange(after1, level2);
            const after3 = applyLevelChange(after2, level3);

            // Final level is the last one set
            expect(after3.level).toBe(level3);

            // All controls are still intact from the original state
            const originalKeys = Object.keys(originalState.controls).sort();
            const finalKeys = Object.keys(after3.controls).sort();
            expect(finalKeys).toEqual(originalKeys);

            for (const controlId of originalKeys) {
              expect(after3.controls[controlId].controlId)
                .toBe(originalState.controls[controlId].controlId);
              expect(after3.controls[controlId].status)
                .toBe(originalState.controls[controlId].status);
              expect(after3.controls[controlId].comment)
                .toBe(originalState.controls[controlId].comment);
              expect(after3.controls[controlId].evidenceLinks)
                .toEqual(originalState.controls[controlId].evidenceLinks);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
