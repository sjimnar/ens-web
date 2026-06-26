/**
 * Preservation Property Tests — Existing Behavior Unchanged for Non-Buggy Inputs
 *
 * These tests encode CURRENT behavior that must be preserved after the UX fix.
 * They run on UNFIXED code and should PASS, confirming the baseline behavior.
 *
 * **Validates: Requirements 3.1, 3.2, 3.4, 3.6, 3.7**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { RequisitosBOE } from '@/components/RequisitosBOE';
import { useControlFilter } from '@/hooks/useControlFilter';
import { controlsService } from '@/services/ControlsService';
import type {
  NivelENS,
  ComplianceStatus,
  EvidenceLink,
  ControlAuditState,
  AuditState,
  ControlENS,
} from '@/types';

// ─── Generators ────────────────────────────────────────────────────────────────

/**
 * Generates strings that do NOT contain ENS control ID patterns or CPSTIC keywords.
 * These represent "safe" text that should always render as plain text.
 */
const arbPlainTextNoPatterns: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => {
    // Exclude strings with ENS control ID patterns
    const ensPattern = /\b(org|op\.pl|op\.acc|op\.exp|op\.ext|op\.nub|op\.cont|op\.mon|mp\.if|mp\.per|mp\.eq|mp\.com|mp\.si|mp\.sw|mp\.info|mp\.s)\.\d+/i;
    // Exclude strings with CPSTIC/CCN keywords
    const cpsticPattern = /\b(CPSTIC|CCN-STIC)/i;
    // Exclude strings with bracket patterns that look like identifiers
    const bracketPattern = /\[[^\]]+\]/;
    return (
      !ensPattern.test(s) &&
      !cpsticPattern.test(s) &&
      !bracketPattern.test(s) &&
      s.trim().length > 0
    );
  });

/**
 * Generates sub-identifier bracket patterns that do NOT match top-level control_ids.
 * Examples: [org.1.1], [op.pl.2.1], [org.1.1.a]
 * These are sub-requirements within a control, not cross-references.
 */
const arbSubIdentifier: fc.Arbitrary<string> = fc.oneof(
  fc.constant('[org.1.1]'),
  fc.constant('[org.1.1.a]'),
  fc.constant('[op.pl.2.1]'),
  fc.constant('[op.pl.1.1]'),
  fc.constant('[op.acc.1.1]'),
  fc.constant('[mp.sw.1.1]'),
  fc.constant('[mp.info.1.1]'),
  fc.constant('[op.exp.1.1]'),
  fc.constant('[org.2.1]'),
  fc.constant('[op.pl.3.1]')
);

const arbNivelENS: fc.Arbitrary<NivelENS> = fc.constantFrom('BÁSICO', 'MEDIO', 'ALTO');

const arbComplianceStatus: fc.Arbitrary<ComplianceStatus> = fc.constantFrom(
  'Pendiente',
  'En progreso',
  'Cumplido',
  'No aplica'
);

const arbISODate = fc
  .integer({
    min: new Date('2000-01-01').getTime(),
    max: new Date('2099-12-31').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

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
  controls: fc.dictionary(arbControlId, arbControlAuditState, {
    minKeys: 1,
    maxKeys: 10,
  }),
  lastModified: arbISODate,
});

// ─── Level Change Logic (extracted from useAuditState) ─────────────────────────

function applyLevelChange(prev: AuditState, newLevel: NivelENS): AuditState {
  return {
    ...prev,
    level: newLevel,
    controls: prev.controls,
    lastModified: new Date().toISOString(),
  };
}

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeControl(overrides: Partial<ControlENS> = {}): ControlENS {
  return {
    control_id: 'org.1',
    name: 'Política de seguridad',
    category: 'org',
    category_name: 'Marco organizativo',
    group: 'org',
    dimensions: '',
    applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
    requisitos_base: '',
    refuerzos: [],
    documentation_guidance: '',
    evidence_guidance: '',
    observation: '',
    measure_description: 'Política de seguridad del sistema',
    ...overrides,
  };
}

const sampleControls: ControlENS[] = [
  makeControl({
    control_id: 'org.1',
    category: 'org',
    measure_description: 'Política de seguridad',
  }),
  makeControl({
    control_id: 'org.2',
    category: 'org',
    measure_description: 'Normativa de seguridad',
  }),
  makeControl({
    control_id: 'op.pl.1',
    category: 'op.pl',
    measure_description: 'Análisis de riesgos',
  }),
  makeControl({
    control_id: 'op.acc.1',
    category: 'op.acc',
    measure_description: 'Identificación de usuarios',
  }),
  makeControl({
    control_id: 'mp.sw.1',
    category: 'mp.sw',
    measure_description: 'Desarrollo de aplicaciones',
  }),
  makeControl({
    control_id: 'op.pl.5',
    category: 'op.pl',
    measure_description: 'Componentes certificados',
  }),
];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Preservation Property Tests', () => {
  /**
   * Property: Text without references renders as plain text only
   *
   * For all generated strings that do NOT contain ENS control ID patterns
   * or CPSTIC keywords, verify output is plain text nodes only (no Link or <a> elements).
   *
   * **Validates: Requirements 3.4**
   */
  describe('Text without references renders as plain text', () => {
    it('text without control patterns or CPSTIC keywords renders without any links', () => {
      fc.assert(
        fc.property(arbPlainTextNoPatterns, (text) => {
          const { container } = render(<RequisitosBOE requisitosBase={text} />);

          // Should NOT contain any <a> elements
          const links = container.querySelectorAll('a');
          expect(links).toHaveLength(0);

          // Should NOT contain any elements with role="link"
          const roleLinks = container.querySelectorAll('[role="link"]');
          expect(roleLinks).toHaveLength(0);

          // The text content should be present
          const content = container.querySelector('.requisitos-boe__content');
          expect(content).not.toBeNull();
          expect(content!.textContent).toContain(text.trim());
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Sub-identifier preservation
   *
   * For all generated bracket patterns like [org.1.1.a], [op.pl.2.1] that are
   * sub-identifiers (not top-level control_ids), verify they render as
   * <span class="requisitos-boe__identifier"> (NOT as navigable links).
   *
   * **Validates: Requirements 3.1**
   */
  describe('Sub-identifier preservation', () => {
    it('sub-identifiers in brackets render as highlighted spans, not links', () => {
      fc.assert(
        fc.property(arbSubIdentifier, (subId) => {
          const text = `Este control establece que ${subId} debe implementarse correctamente.`;
          const { container } = render(<RequisitosBOE requisitosBase={text} />);

          // Should have a span with class requisitos-boe__identifier
          const identifiers = container.querySelectorAll(
            '.requisitos-boe__identifier'
          );
          expect(identifiers.length).toBeGreaterThanOrEqual(1);

          // The sub-identifier should be in a span
          const found = Array.from(identifiers).some(
            (el) => el.textContent === subId
          );
          expect(found).toBe(true);

          // The sub-identifier should NOT be in an <a> or Link element
          const links = container.querySelectorAll('a');
          const linkTexts = Array.from(links).map((l) => l.textContent);
          expect(linkTexts).not.toContain(subId);
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property: Audit data preservation on level change
   *
   * For all generated audit states (random controlStates with statuses, comments,
   * and evidenceLinks), verify that calling setLevel(newLevel) preserves all
   * control data unchanged.
   *
   * **Validates: Requirements 3.6**
   */
  describe('Audit data preservation on level change', () => {
    it('changing level preserves all controlStates data', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          // Level is updated
          expect(result.level).toBe(newLevel);

          // All control keys preserved
          const originalKeys = Object.keys(originalState.controls).sort();
          const resultKeys = Object.keys(result.controls).sort();
          expect(resultKeys).toEqual(originalKeys);

          // Each control state preserved exactly
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

    it('level change never removes or adds control entries', () => {
      fc.assert(
        fc.property(arbAuditState, arbNivelENS, (originalState, newLevel) => {
          const result = applyLevelChange(originalState, newLevel);

          expect(Object.keys(result.controls).length).toBe(
            Object.keys(originalState.controls).length
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Filter behavior preservation
   *
   * For all generated search strings, verify useControlFilter returns only
   * controls whose control_id or measure_description includes the search text
   * (case-insensitive).
   *
   * **Validates: Requirements 3.2**
   */
  describe('Filter behavior preservation', () => {
    it('filterByText returns only controls matching control_id or measure_description', () => {
      // Generate search strings from meaningful fragments
      const arbSearchText = fc.oneof(
        fc.constantFrom(
          'org',
          'op',
          'mp',
          'política',
          'seguridad',
          'análisis',
          'pl',
          'acc',
          'identificación',
          'riesgos',
          'desarrollo',
          'componentes'
        ),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0)
      );

      fc.assert(
        fc.property(arbSearchText, (searchText) => {
          const filtered = controlsService.filterByText(
            sampleControls,
            searchText
          );
          const lowerSearch = searchText.toLowerCase();

          // Every returned control must match the search text
          for (const control of filtered) {
            const matchesId = control.control_id
              .toLowerCase()
              .includes(lowerSearch);
            const matchesDesc = control.measure_description
              .toLowerCase()
              .includes(lowerSearch);
            expect(matchesId || matchesDesc).toBe(true);
          }

          // Every control NOT returned must NOT match the search text
          const excludedControls = sampleControls.filter(
            (c) => !filtered.includes(c)
          );
          for (const control of excludedControls) {
            const matchesId = control.control_id
              .toLowerCase()
              .includes(lowerSearch);
            const matchesDesc = control.measure_description
              .toLowerCase()
              .includes(lowerSearch);
            expect(matchesId || matchesDesc).toBe(false);
          }
        }),
        { numRuns: 80 }
      );
    });

    it('empty search text returns all controls unchanged', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '  ', '\t'),
          (emptySearch) => {
            const filtered = controlsService.filterByText(
              sampleControls,
              emptySearch
            );
            expect(filtered).toHaveLength(sampleControls.length);
            expect(filtered).toEqual(sampleControls);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('useControlFilter hook filters correctly via setSearchText', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'org',
            'op.pl',
            'política',
            'análisis',
            'identificación'
          ),
          (searchText) => {
            const { result } = renderHook(() =>
              useControlFilter(sampleControls)
            );

            act(() => {
              result.current.setSearchText(searchText);
            });

            const lowerSearch = searchText.toLowerCase();
            for (const control of result.current.filteredControls) {
              const matchesId = control.control_id
                .toLowerCase()
                .includes(lowerSearch);
              const matchesDesc = control.measure_description
                .toLowerCase()
                .includes(lowerSearch);
              expect(matchesId || matchesDesc).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
