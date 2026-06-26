/**
 * Property-based tests for useProgressStats (calculateProgress function).
 *
 * Validates: Requirements 6.1, 6.3, 6.4
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateProgress } from './useProgressStats';
import { ControlsService } from '@/services/ControlsService';
import type {
  ControlENS,
  NivelENS,
  Applicability,
  Refuerzo,
  ComplianceStatus,
  ControlAuditState,
} from '@/types';

// --- Generators ---

const CATEGORIES = [
  'org',
  'op.pl',
  'op.acc',
  'op.exp',
  'op.ext',
  'op.nub',
  'op.cont',
  'op.mon',
  'mp.if',
  'mp.per',
  'mp.eq',
  'mp.com',
  'mp.si',
  'mp.sw',
  'mp.info',
  'mp.s',
] as const;

const APPLICABILITY_VALUES = ['aplica', 'n.a.', '+ R1', '+ R1 + R2'] as const;

const nivelGen: fc.Arbitrary<NivelENS> = fc.constantFrom('BÁSICO', 'MEDIO', 'ALTO');

const complianceStatusGen: fc.Arbitrary<ComplianceStatus> = fc.constantFrom(
  'Pendiente',
  'En progreso',
  'Cumplido',
  'No aplica'
);

const categoryGen: fc.Arbitrary<string> = fc.constantFrom(...CATEGORIES);

const applicabilityValueGen = fc.constantFrom(...APPLICABILITY_VALUES);

const applicabilityGen: fc.Arbitrary<Applicability> = fc.record({
  basica: applicabilityValueGen,
  media: applicabilityValueGen,
  alta: applicabilityValueGen,
});

const refuerzoGen: fc.Arbitrary<Refuerzo> = fc.record({
  id: fc.constantFrom('R1', 'R2', 'R3'),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 50 }),
});

const controlENSGen: fc.Arbitrary<ControlENS> = fc.record({
  control_id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: categoryGen,
  category_name: fc.string({ minLength: 1, maxLength: 40 }),
  group: fc.constantFrom('org', 'op', 'mp'),
  dimensions: fc.string({ minLength: 0, maxLength: 30 }),
  applicability: applicabilityGen,
  requisitos_base: fc.string({ minLength: 0, maxLength: 100 }),
  refuerzos: fc.array(refuerzoGen, { minLength: 0, maxLength: 3 }),
  documentation_guidance: fc.string({ minLength: 0, maxLength: 50 }),
  evidence_guidance: fc.string({ minLength: 0, maxLength: 50 }),
  observation: fc.string({ minLength: 0, maxLength: 50 }),
  measure_description: fc.string({ minLength: 0, maxLength: 100 }),
});

const controlListGen = fc.array(controlENSGen, { minLength: 0, maxLength: 20 });

/** Generate a unique list of controls (unique control_id) */
const uniqueControlListGen = controlListGen.map((controls) => {
  const seen = new Set<string>();
  return controls.filter((c) => {
    if (seen.has(c.control_id)) return false;
    seen.add(c.control_id);
    return true;
  });
});

/** Generate audit states for a given list of controls */
function auditStatesGen(
  controls: ControlENS[]
): fc.Arbitrary<Record<string, ControlAuditState>> {
  if (controls.length === 0) {
    return fc.constant({});
  }

  return fc
    .tuple(
      ...controls.map((control) =>
        fc.tuple(
          fc.constant(control.control_id),
          fc.boolean(), // whether to include this control in audit states
          complianceStatusGen
        )
      )
    )
    .map((entries) => {
      const record: Record<string, ControlAuditState> = {};
      for (const [controlId, include, status] of entries) {
        if (include) {
          record[controlId] = {
            controlId,
            status,
            comment: '',
            evidenceLinks: [],
          };
        }
      }
      return record;
    });
}

// --- Service instance ---

const controlsService = new ControlsService();

// --- Property Tests ---

describe('useProgressStats Property Tests', () => {
  /**
   * Property 13: Progress distribution sum invariant
   *
   * For any set of controls with assigned compliance statuses, the sum of all
   * distribution segments (pendiente + enProgreso + cumplido + noAplica) shall
   * equal the total number of controls in the set.
   *
   * **Validates: Requirements 6.1, 6.3**
   */
  describe('Property 13: Progress distribution sum invariant', () => {
    it('sum of all segments equals the total number of controls', () => {
      fc.assert(
        fc.property(uniqueControlListGen, (controls) => {
          // Generate random audit states inline for each control
          const auditStates: Record<string, ControlAuditState> = {};
          const statuses: ComplianceStatus[] = [
            'Pendiente',
            'En progreso',
            'Cumplido',
            'No aplica',
          ];
          for (const control of controls) {
            // Some controls may not have audit state (treated as Pendiente)
            if (Math.random() > 0.3) {
              const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
              auditStates[control.control_id] = {
                controlId: control.control_id,
                status: randomStatus,
                comment: '',
                evidenceLinks: [],
              };
            }
          }

          const distribution = calculateProgress(controls, auditStates);

          // Sum of segments must equal total
          const segmentSum =
            distribution.pendiente +
            distribution.enProgreso +
            distribution.cumplido +
            distribution.noAplica;

          expect(segmentSum).toBe(distribution.total);
          expect(distribution.total).toBe(controls.length);
        }),
        { numRuns: 100 }
      );
    });

    it('sum of segments equals total when all controls have explicit states', () => {
      fc.assert(
        fc.property(
          uniqueControlListGen.chain((controls) =>
            fc.tuple(fc.constant(controls), auditStatesGen(controls))
          ),
          ([controls, auditStates]) => {
            const distribution = calculateProgress(controls, auditStates);

            const segmentSum =
              distribution.pendiente +
              distribution.enProgreso +
              distribution.cumplido +
              distribution.noAplica;

            expect(segmentSum).toBe(distribution.total);
            expect(distribution.total).toBe(controls.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sum of segments equals total when no controls have audit state (all Pendiente)', () => {
      fc.assert(
        fc.property(uniqueControlListGen, (controls) => {
          const emptyAuditStates: Record<string, ControlAuditState> = {};

          const distribution = calculateProgress(controls, emptyAuditStates);

          const segmentSum =
            distribution.pendiente +
            distribution.enProgreso +
            distribution.cumplido +
            distribution.noAplica;

          expect(segmentSum).toBe(distribution.total);
          expect(distribution.total).toBe(controls.length);
          // All should be Pendiente when no state exists
          expect(distribution.pendiente).toBe(controls.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Progress counts only level-applicable controls
   *
   * For any NivelENS selection and full control set, the progress distribution
   * total shall equal the count of controls applicable to that level, not the
   * total control count.
   *
   * **Validates: Requirements 6.4**
   */
  describe('Property 14: Progress counts only level-applicable controls', () => {
    it('distribution total equals the number of level-filtered controls', () => {
      fc.assert(
        fc.property(uniqueControlListGen, nivelGen, (controls, level) => {
          // Filter controls by level (as the app does before passing to calculateProgress)
          const filteredControls = controlsService.filterByLevel(controls, level);

          // Build audit states for filtered controls
          const auditStates: Record<string, ControlAuditState> = {};
          const statuses: ComplianceStatus[] = [
            'Pendiente',
            'En progreso',
            'Cumplido',
            'No aplica',
          ];
          for (const control of filteredControls) {
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            auditStates[control.control_id] = {
              controlId: control.control_id,
              status: randomStatus,
              comment: '',
              evidenceLinks: [],
            };
          }

          const distribution = calculateProgress(filteredControls, auditStates);

          // Total must equal the filtered (level-applicable) count
          expect(distribution.total).toBe(filteredControls.length);
          // And must NOT necessarily equal the full control count (unless all apply)
          if (filteredControls.length !== controls.length) {
            expect(distribution.total).not.toBe(controls.length);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('distribution total matches filterByLevel count for all levels', () => {
      fc.assert(
        fc.property(
          uniqueControlListGen.chain((controls) =>
            fc.tuple(fc.constant(controls), nivelGen, auditStatesGen(controls))
          ),
          ([controls, level, auditStates]) => {
            const filteredControls = controlsService.filterByLevel(controls, level);
            const distribution = calculateProgress(filteredControls, auditStates);

            expect(distribution.total).toBe(filteredControls.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('using full control set without level filter gives total === all controls', () => {
      fc.assert(
        fc.property(
          uniqueControlListGen.chain((controls) =>
            fc.tuple(fc.constant(controls), auditStatesGen(controls))
          ),
          ([controls, auditStates]) => {
            // Without level filtering, total should be all controls
            const distribution = calculateProgress(controls, auditStates);
            expect(distribution.total).toBe(controls.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
