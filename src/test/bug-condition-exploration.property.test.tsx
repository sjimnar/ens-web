import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';
import { RequisitosBOE } from '@/components/RequisitosBOE';
import { controlsService } from '@/services/ControlsService';

/**
 * Bug Condition Exploration Property Test
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 *
 * This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the six UX bugs exist in the current codebase.
 *
 * **Property 1: Bug Condition** - ENS UX Defects Exist on Unfixed Code
 */
describe('Property 1: Bug Condition - ENS UX Defects Exist on Unfixed Code', () => {
  // ─── Test 1.1: Control References Are Not Rendered as Links ──────────
  describe('Test 1.1: Control References should render as navigable links', () => {
    /**
     * Generate strings containing valid ENS control ID patterns.
     * Verify that RequisitosBOE renders them as <a> or Link elements with href.
     * EXPECTED TO FAIL: Current code renders only <span> elements.
     */
    it('should render valid control references as clickable links (will FAIL - only <span> exists)', () => {
      // Get valid control IDs from the dataset
      const allControls = controlsService.loadControls();
      const validIds = allControls.map(c => c.control_id);

      // Arbitrary that generates text containing a valid control ID in brackets
      const controlRefArb = fc.constantFrom(...validIds.slice(0, 20)).map(
        id => `Este control requiere implementar [${id}] como medida complementaria.`
      );

      fc.assert(
        fc.property(controlRefArb, (text) => {
          const { container } = render(
            <MemoryRouter>
              <RequisitosBOE requisitosBase={text} />
            </MemoryRouter>
          );

          // Extract the control_id from the text
          const match = text.match(/\[([^\]]+)\]/);
          const controlId = match ? match[1] : '';

          // Assert that a link element exists pointing to the referenced control
          const link = container.querySelector(`a[href="/controls/${controlId}"]`);
          expect(link).not.toBeNull();
        }),
        { numRuns: 10 }
      );
    });

    it('should render plain-text control IDs (without brackets) as links (will FAIL)', () => {
      // Use actual valid control IDs from the dataset to generate test cases
      const allControls = controlsService.loadControls();
      const validIds = allControls.map(c => c.control_id);

      const plainRefArb = fc.constantFrom(...validIds.slice(0, 20)).map(
        (id) => ({
          text: `Se debe cumplir con ${id} para garantizar la seguridad.`,
          id: id.toLowerCase()
        })
      );

      fc.assert(
        fc.property(plainRefArb, ({ text, id }) => {
          const { container } = render(
            <MemoryRouter>
              <RequisitosBOE requisitosBase={text} />
            </MemoryRouter>
          );

          // Assert that a link element exists for the plain-text control reference
          const link = container.querySelector(`a[href="/controls/${id}"]`);
          expect(link).not.toBeNull();
        }),
        { numRuns: 10 }
      );
    });
  });

  // ─── Test 1.2: CPSTIC Links Are Not Rendered ─────────────────────────
  describe('Test 1.2: CPSTIC/CCN references should render as external links', () => {
    /**
     * Generate strings containing CPSTIC or CCN-STIC patterns.
     * Verify that an <a> with external href and target="_blank" exists.
     * EXPECTED TO FAIL: Current code renders only plain text.
     */
    it('should render CPSTIC references as external links (will FAIL - only plain text)', () => {
      const cpstricPatternArb = fc.constantFrom(
        'Se recomienda consultar el catálogo CPSTIC del CCN para productos certificados.',
        'Véase la guía CCN-STIC-810 para la configuración de este control.',
        'Los productos deben estar en el CPSTIC según la normativa vigente.',
        'Consultar CCN-STIC para más detalle sobre implementación.',
        'El catálogo CPSTIC proporciona una lista de productos cualificados.'
      );

      fc.assert(
        fc.property(cpstricPatternArb, (text) => {
          const { container } = render(
            <MemoryRouter>
              <RequisitosBOE requisitosBase={text} />
            </MemoryRouter>
          );

          // Assert that an external link with target="_blank" exists
          const externalLink = container.querySelector('a[target="_blank"]');
          expect(externalLink).not.toBeNull();
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Test 1.3: Global Search Is Not Present on Detail Page ───────────
  describe('Test 1.3: Global search should be present on ControlDetailPage', () => {
    /**
     * Render ControlDetailPage route.
     * Assert a search input with accessible role is present.
     * EXPECTED TO FAIL: No search component exists outside ControlListPage.
     */
    it('should have a search input accessible from the detail page (will FAIL - no search component)', async () => {
      // Set up required localStorage for ProtectedRoute
      localStorage.setItem('ens-audit-level', 'MEDIO');

      // Dynamically import App to render the full routing
      const { default: App } = await import('@/App');

      render(
        <MemoryRouter initialEntries={['/controls/op.pl.1']}>
          <App />
        </MemoryRouter>
      );

      // Assert a search input is present in the DOM
      const searchInput = screen.queryByRole('searchbox') ??
        screen.queryByRole('textbox', { name: /buscar|search/i }) ??
        screen.queryByPlaceholderText(/buscar|search/i);

      expect(searchInput).not.toBeNull();
    });
  });

  // ─── Test 1.4: Dark Theme Reduces Legibility ─────────────────────────
  describe('Test 1.4: Light theme should always be applied', () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    /**
     * With prefers-color-scheme: dark simulated, assert that CSS variable --bg
     * resolves to #fff (light theme).
     * EXPECTED TO FAIL: Dark theme applies --bg: #16171d via media query in index.css.
     *
     * We verify that the source CSS file does NOT contain the dark media query.
     */
    it('should not have a dark theme media query in index.css (will FAIL - dark theme exists)', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // Assert that no dark theme media query exists
      expect(cssContent).not.toContain('prefers-color-scheme: dark');
    });
  });

  // ─── Test 1.5: Level Change Redirect Loop ────────────────────────────
  describe('Test 1.5: "Cambiar nivel" should show LevelSelector', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    /**
     * Set ens-audit-level in localStorage to "MEDIO", render App at /controls,
     * click "Cambiar nivel" button. Assert LevelSelector is displayed.
     * EXPECTED TO FAIL: Redirect loop back to /controls.
     */
    it('should display LevelSelector after clicking "Cambiar nivel" (will FAIL - redirect loop)', async () => {
      // Set up stored level to trigger the bug
      localStorage.setItem('ens-audit-level', 'MEDIO');

      const { default: App } = await import('@/App');

      render(
        <MemoryRouter initialEntries={['/controls']}>
          <App />
        </MemoryRouter>
      );

      // Find and click "Cambiar nivel" button
      const changeBtn = screen.queryByRole('button', { name: /cambiar nivel/i });
      expect(changeBtn).not.toBeNull();

      if (changeBtn) {
        fireEvent.click(changeBtn);
      }

      // After clicking, LevelSelector should be displayed
      // LevelSelector shows level options: BÁSICO, MEDIO, ALTO
      const levelOption = screen.queryByText('BÁSICO') ??
        screen.queryByRole('button', { name: /básico/i });

      expect(levelOption).not.toBeNull();
    });
  });

  // ─── Test 1.6: Sidebar Layout Not Present ────────────────────────────
  describe('Test 1.6: Sidebar layout should show list + detail simultaneously', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    /**
     * Navigate to /controls/op.pl.1. Assert both controls list sidebar and
     * control detail are simultaneously visible in DOM.
     * EXPECTED TO FAIL: Only detail page renders, no sidebar with controls list.
     */
    it('should render both sidebar controls list and detail panel (will FAIL - only detail renders)', async () => {
      localStorage.setItem('ens-audit-level', 'MEDIO');

      const { default: App } = await import('@/App');

      render(
        <MemoryRouter initialEntries={['/controls/op.pl.1']}>
          <App />
        </MemoryRouter>
      );

      // The detail page should be present
      const detailContent = screen.queryByText('← Volver a la lista') ??
        screen.queryByText(/op\.pl\.1/);
      expect(detailContent).not.toBeNull();

      // A sidebar with controls list should also be present simultaneously
      // Look for a sidebar/nav element containing control cards or a list of controls
      const sidebar = document.querySelector('[class*="sidebar"]') ??
        document.querySelector('nav[aria-label*="control"]') ??
        document.querySelector('[role="navigation"][aria-label*="control"]');

      expect(sidebar).not.toBeNull();
    });
  });
});
