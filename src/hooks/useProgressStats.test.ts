import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateProgress } from './useProgressStats';
import { ControlsService } from '@/services/ControlsService';
import type { ControlENS, ControlAuditState, ComplianceStatus, NivelENS } from '@/types';

/**
 * Arbitrary para generar un valor de applicability válido.
 */
const arbApplicabilityValue = fc.oneof(
  fc.constant('aplica'),
  fc.constant('n.a.'),
  fc.constant('+ R1'),
  fc.constant('+ R1 + R2'),
  fc.constant('+ R2')
);

/**
 * Arbitrary para generar un ControlENS válido.
 */
const arbControlENS: fc.Arbitrary<ControlENS> = fc.record({
  control_id: fc.nat().map(n => `ctrl.${n}`),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('org', 'op.pl', 'op.acc', 'mp.if', 'mp.com'),
  category_name: fc.string({ minLength: 1, maxLength: 50 }),
  group: fc.constantFrom('org', 'op', 'mp'),
  dimensions: fc.string({ minLength: 0, maxLength: 30 }),
  applicability: fc.record({
    basica: arbApplicabilityValue,
    media: arbApplicabilityValue,
    alta: arbApplicabilityValue,
  }),
  requisitos_base: fc.constant(''),
  refuerzos: fc.constant([]),
  documentation_guidance: fc.constant(''),
  evidence_guidance: fc.constant(''),
  observation: fc.constant(''),
  measure_description: fc.string({ minLength: 1, maxLength: 100 }),
});

/**
 * Arbitrary para generar un ComplianceStatus válido.
 */
const arbComplianceStatus: fc.Arbitrary<ComplianceStatus> = fc.constantFrom(
  'Pendiente',
  'En progreso',
  'Cumplido',
  'No aplica'
);

/**
 * Arbitrary para generar un NivelENS válido.
 */
const arbNivelENS: fc.Arbitrary<NivelENS> = fc.constantFrom('BÁSICO', 'MEDIO', 'ALTO');

describe('useProgressStats - Property Tests', () => {
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
    it('sum of all segments equals total for any controls and random audit states', () => {
      fc.assert(
        fc.property(
          fc.array(arbControlENS, { minLength: 0, maxLength: 50 }),
          fc.array(arbComplianceStatus, { minLength: 0, maxLength: 50 }),
          (controls, statuses) => {
            // Ensure unique control_ids
            const uniqueControls = controls.map((ctrl, i) => ({
              ...ctrl,
              control_id: `ctrl.${i}`,
            }));

            // Build audit states: assign statuses to a subset of controls
            const auditStates: Record<string, ControlAuditState> = {};
            for (let i = 0; i < Math.min(statuses.length, uniqueControls.length); i++) {
              const id = uniqueControls[i].control_id;
              auditStates[id] = {
                controlId: id,
                status: statuses[i],
                comment: '',
                evidenceLinks: [],
              };
            }

            const result = calculateProgress(uniqueControls, auditStates);

            const segmentsSum = result.pendiente + result.enProgreso + result.cumplido + result.noAplica;
            expect(segmentsSum).toBe(result.total);
            expect(result.total).toBe(uniqueControls.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sum invariant holds with all controls having explicit states', () => {
      fc.assert(
        fc.property(
          fc.array(arbControlENS, { minLength: 1, maxLength: 30 }),
          fc.array(arbComplianceStatus, { minLength: 30, maxLength: 30 }),
          (controls, statuses) => {
            // Ensure unique IDs and assign a status to every control
            const uniqueControls = controls.map((ctrl, i) => ({
              ...ctrl,
              control_id: `ctrl.${i}`,
            }));

            const auditStates: Record<string, ControlAuditState> = {};
            for (let i = 0; i < uniqueControls.length; i++) {
              const id = uniqueControls[i].control_id;
              auditStates[id] = {
                controlId: id,
                status: statuses[i % statuses.length],
                comment: '',
                evidenceLinks: [],
              };
            }

            const result = calculateProgress(uniqueControls, auditStates);

            const segmentsSum = result.pendiente + result.enProgreso + result.cumplido + result.noAplica;
            expect(segmentsSum).toBe(uniqueControls.length);
            expect(result.total).toBe(uniqueControls.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sum invariant holds with empty audit states (all default to Pendiente)', () => {
      fc.assert(
        fc.property(
          fc.array(arbControlENS, { minLength: 0, maxLength: 40 }),
          (controls) => {
            const uniqueControls = controls.map((ctrl, i) => ({
              ...ctrl,
              control_id: `ctrl.${i}`,
            }));

            const result = calculateProgress(uniqueControls, {});

            const segmentsSum = result.pendiente + result.enProgreso + result.cumplido + result.noAplica;
            expect(segmentsSum).toBe(uniqueControls.length);
            expect(result.pendiente).toBe(uniqueControls.length);
            expect(result.total).toBe(uniqueControls.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Progress counts only level-applicable controls
   *
   * For any NivelENS selection and full control set, the progress distribution
   * total shall equal the count of controls where applicability[levelKey] !== "n.a.",
   * not the total 73 controls.
   *
   * **Validates: Requirements 6.4**
   */
  describe('Property 14: Progress counts only level-applicable controls', () => {
    it('progress total equals filtered control count, not full set', () => {
      const service = new ControlsService();
      const allControls = service.loadControls();

      fc.assert(
        fc.property(
          arbNivelENS,
          (level) => {
            // Filter by level (as the app does before passing to calculateProgress)
            const applicableControls = service.filterByLevel(allControls, level);

            const result = calculateProgress(applicableControls, {});

            // Total should be the filtered count, not 73
            expect(result.total).toBe(applicableControls.length);
            expect(result.total).toBeLessThanOrEqual(allControls.length);

            // The sum should still equal total
            const segmentsSum = result.pendiente + result.enProgreso + result.cumplido + result.noAplica;
            expect(segmentsSum).toBe(result.total);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('progress total matches level filter count with random audit states', () => {
      const service = new ControlsService();
      const allControls = service.loadControls();

      fc.assert(
        fc.property(
          arbNivelENS,
          fc.array(
            fc.record({
              index: fc.nat({ max: 72 }),
              status: arbComplianceStatus,
            }),
            { minLength: 0, maxLength: 73 }
          ),
          (level, statusAssignments) => {
            const applicableControls = service.filterByLevel(allControls, level);
            const expectedCount = applicableControls.length;

            // Build random audit states for the applicable controls
            const auditStates: Record<string, ControlAuditState> = {};
            for (const assignment of statusAssignments) {
              if (applicableControls.length === 0) break;
              const idx = assignment.index % applicableControls.length;
              const controlId = applicableControls[idx].control_id;
              auditStates[controlId] = {
                controlId,
                status: assignment.status,
                comment: '',
                evidenceLinks: [],
              };
            }

            const result = calculateProgress(applicableControls, auditStates);

            // Total must equal the number of level-applicable controls
            expect(result.total).toBe(expectedCount);

            // Sum invariant still holds
            const segmentsSum = result.pendiente + result.enProgreso + result.cumplido + result.noAplica;
            expect(segmentsSum).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('known level counts match expected values from real data', () => {
      const service = new ControlsService();
      const allControls = service.loadControls();

      // Verify that filtering by level produces different counts
      const basicControls = service.filterByLevel(allControls, 'BÁSICO');
      const medioControls = service.filterByLevel(allControls, 'MEDIO');
      const altoControls = service.filterByLevel(allControls, 'ALTO');

      const basicResult = calculateProgress(basicControls, {});
      const medioResult = calculateProgress(medioControls, {});
      const altoResult = calculateProgress(altoControls, {});

      // Each progress total matches its filtered list length
      expect(basicResult.total).toBe(basicControls.length);
      expect(medioResult.total).toBe(medioControls.length);
      expect(altoResult.total).toBe(altoControls.length);

      // Lower levels have fewer controls; ALTO includes all
      expect(basicResult.total).toBeLessThan(allControls.length);
      expect(medioResult.total).toBeLessThanOrEqual(allControls.length);
      expect(altoResult.total).toBe(allControls.length);
    });
  });
});
