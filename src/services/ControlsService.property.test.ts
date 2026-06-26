/**
 * Property-based tests for ControlsService.
 *
 * Validates: Requirements 1.2, 2.1, 2.3, 2.4, 2.5
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ControlsService } from './ControlsService';
import type { ControlENS, NivelENS, Applicability, Refuerzo } from '@/types';

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

// --- Helper ---

function levelToKey(level: NivelENS): keyof Applicability {
  switch (level) {
    case 'BÁSICO':
      return 'basica';
    case 'MEDIO':
      return 'media';
    case 'ALTO':
      return 'alta';
  }
}

// --- Service instance ---

const service = new ControlsService();

// --- Property Tests ---

describe('ControlsService Property Tests', () => {
  /**
   * Property 1: Level filter correctness
   *
   * For any valid NivelENS and list of ControlENS entries, the filter function
   * shall return only controls applicable to that level, and no control outside
   * that level shall be included.
   *
   * **Validates: Requirements 1.2**
   */
  describe('Property 1: Level filter correctness', () => {
    it('returns only controls where applicability[levelKey] !== "n.a."', () => {
      fc.assert(
        fc.property(controlListGen, nivelGen, (controls, level) => {
          const result = service.filterByLevel(controls, level);
          const key = levelToKey(level);

          // Every returned control must have applicability !== "n.a."
          for (const control of result) {
            expect(control.applicability[key]).not.toBe('n.a.');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('does not exclude any control that applies to the level', () => {
      fc.assert(
        fc.property(controlListGen, nivelGen, (controls, level) => {
          const result = service.filterByLevel(controls, level);
          const key = levelToKey(level);

          // Every control that applies must be in the result
          const applicable = controls.filter((c) => c.applicability[key] !== 'n.a.');
          expect(result.length).toBe(applicable.length);
        }),
        { numRuns: 100 }
      );
    });

    it('excludes all controls with applicability === "n.a." for the level', () => {
      fc.assert(
        fc.property(controlListGen, nivelGen, (controls, level) => {
          const result = service.filterByLevel(controls, level);
          const key = levelToKey(level);

          // No control with "n.a." for the level should be in the result
          const excluded = controls.filter((c) => c.applicability[key] === 'n.a.');
          for (const excludedControl of excluded) {
            expect(result).not.toContain(excludedControl);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Category grouping correctness
   *
   * For any list of ControlENS entries, after grouping by Categoría, every control
   * within a group shall have exactly the same category value as the group key.
   *
   * **Validates: Requirements 2.1**
   */
  describe('Property 4: Category grouping correctness', () => {
    it('getCategories returns unique categories and filterByCategory groups correctly', () => {
      fc.assert(
        fc.property(controlListGen, (controls) => {
          const categories = service.getCategories(controls);

          // For every category returned, filtering by that category must yield
          // only controls with that exact category value
          for (const category of categories) {
            const group = service.filterByCategory(controls, category);
            for (const control of group) {
              expect(control.category).toBe(category);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('every control appears in exactly the group matching its category', () => {
      fc.assert(
        fc.property(controlListGen, (controls) => {
          const categories = service.getCategories(controls);

          // Every control's category must be in the categories list
          for (const control of controls) {
            expect(categories).toContain(control.category);
          }

          // The union of all category-filtered groups covers all controls
          let totalGrouped = 0;
          for (const category of categories) {
            const group = service.filterByCategory(controls, category);
            totalGrouped += group.length;
          }
          expect(totalGrouped).toBe(controls.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Text filter soundness and completeness
   *
   * For any search string and list of ControlENS entries, the text filter shall
   * return exactly those controls whose control_id or measure_description contains
   * the search string (case-insensitive).
   *
   * **Validates: Requirements 2.3**
   */
  describe('Property 5: Text filter soundness and completeness', () => {
    it('returns exactly the controls matching by control_id or measure_description', () => {
      fc.assert(
        fc.property(controlListGen, fc.string({ minLength: 1, maxLength: 10 }), (controls, text) => {
          const result = service.filterByText(controls, text);

          // Implementation treats whitespace-only text as "no filter" (returns all)
          if (!text.trim()) {
            expect(result.length).toBe(controls.length);
            return;
          }

          const lowerText = text.toLowerCase();

          // Soundness: every returned control must contain the search text
          for (const control of result) {
            const matches =
              control.control_id.toLowerCase().includes(lowerText) ||
              control.measure_description.toLowerCase().includes(lowerText);
            expect(matches).toBe(true);
          }

          // Completeness: every control that matches must be in the result
          const expected = controls.filter(
            (c) =>
              c.control_id.toLowerCase().includes(lowerText) ||
              c.measure_description.toLowerCase().includes(lowerText)
          );
          expect(result.length).toBe(expected.length);
        }),
        { numRuns: 100 }
      );
    });

    it('empty search text returns all controls', () => {
      fc.assert(
        fc.property(controlListGen, (controls) => {
          const result = service.filterByText(controls, '');
          expect(result.length).toBe(controls.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Category filter soundness
   *
   * For any selected category and list of ControlENS entries, the category filter
   * shall return only controls with that exact category, and all controls of that
   * category shall be included.
   *
   * **Validates: Requirements 2.4**
   */
  describe('Property 6: Category filter soundness', () => {
    it('returns only controls with the exact category and includes all of them', () => {
      fc.assert(
        fc.property(controlListGen, categoryGen, (controls, category) => {
          const result = service.filterByCategory(controls, category);

          // Soundness: every returned control has the exact category
          for (const control of result) {
            expect(control.category).toBe(category);
          }

          // Completeness: all controls with the category are included
          const expected = controls.filter((c) => c.category === category);
          expect(result.length).toBe(expected.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Sort ordering correctness
   *
   * For any list of ControlENS entries and valid sort field, the sorted output shall
   * be in non-decreasing order according to the specified field when sorting ascending.
   *
   * **Validates: Requirements 2.5**
   */
  describe('Property 7: Sort ordering correctness', () => {
    const sortFieldGen = fc.constantFrom('category', 'control_id', 'status');

    it('sorted output is in non-decreasing order for ascending direction', () => {
      fc.assert(
        fc.property(controlListGen, sortFieldGen, (controls, sortBy) => {
          const sorted = service.sortControls(controls, sortBy, 'asc');

          // Verify non-decreasing order
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];

            let prevValue: string;
            let currValue: string;

            switch (sortBy) {
              case 'category':
                prevValue = prev.category;
                currValue = curr.category;
                break;
              case 'control_id':
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
              case 'status':
                // Falls back to control_id sorting per implementation
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
              default:
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
            }

            expect(prevValue.localeCompare(currValue)).toBeLessThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('sorted output is in non-increasing order for descending direction', () => {
      fc.assert(
        fc.property(controlListGen, sortFieldGen, (controls, sortBy) => {
          const sorted = service.sortControls(controls, sortBy, 'desc');

          // Verify non-increasing order
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];

            let prevValue: string;
            let currValue: string;

            switch (sortBy) {
              case 'category':
                prevValue = prev.category;
                currValue = curr.category;
                break;
              case 'control_id':
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
              case 'status':
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
              default:
                prevValue = prev.control_id;
                currValue = curr.control_id;
                break;
            }

            expect(prevValue.localeCompare(currValue)).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('sort does not add or remove elements', () => {
      fc.assert(
        fc.property(controlListGen, sortFieldGen, (controls, sortBy) => {
          const sorted = service.sortControls(controls, sortBy, 'asc');
          expect(sorted.length).toBe(controls.length);
        }),
        { numRuns: 100 }
      );
    });
  });
});
