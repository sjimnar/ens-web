# Implementation Plan

## Overview

This task list implements the ENS UX Improvements bugfix following the exploratory bugfix workflow: (1) write tests confirming bugs exist on unfixed code, (2) write preservation tests for non-buggy behavior, (3) implement fixes, (4) validate all tests pass. The six bugs addressed are: non-navigable control references, missing CPSTIC links, no global search, dark theme reducing legibility, level change redirect loop, and missing sidebar layout.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - ENS UX Defects Exist on Unfixed Code
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the 6 UX bugs exist
  - **Scoped PBT Approach**: Use fast-check to generate text strings containing ENS control ID patterns and verify the current rendering does NOT produce links
  - Test 1.1 (Control References): Generate strings with valid control patterns (`op.pl.5`, `[mp.sw.1]`, `org.1`) using fast-check arbitraries. Render `RequisitosBOE` with these strings. Assert that a `<Link>` or `<a>` element with href `/controls/op.pl.5` exists (will FAIL — only `<span>` exists in current code)
  - Test 1.2 (CPSTIC Links): Generate strings containing "CPSTIC", "CCN-STIC-810" patterns. Render the text. Assert an `<a>` with external href and `target="_blank"` exists (will FAIL — only plain text rendered)
  - Test 1.3 (Global Search): Render `ControlDetailPage` route. Assert a search input with accessible role is present in the DOM (will FAIL — no search component exists outside ControlListPage)
  - Test 1.4 (Dark Theme): With `prefers-color-scheme: dark` simulated via matchMedia mock, assert CSS variable `--bg` resolves to `#fff` (will FAIL — dark theme applies `#16171d`)
  - Test 1.5 (Level Change): Set `ens-audit-level` in localStorage to "MEDIO", render App at `/controls`, click "Cambiar nivel" button. Assert `LevelSelector` is displayed (will FAIL — redirect loop back to `/controls`)
  - Test 1.6 (Sidebar Layout): Navigate to `/controls/op.pl.1`. Assert both controls list sidebar and control detail are simultaneously visible in DOM (will FAIL — only detail page renders)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found: text with control references renders only `<span>` elements; "Cambiar nivel" triggers infinite redirect; no sidebar panel present
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Behavior Unchanged for Non-Buggy Inputs
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code first**:
    - Observe: Text without control patterns (e.g., "Este control aplica medidas de seguridad") renders as plain text nodes in RequisitosBOE
    - Observe: Sub-identifiers like `[org.1.1]` and `[op.pl.2.1]` inside their parent control render as highlighted `<span class="requisitos-boe__identifier">` elements (current behavior)
    - Observe: `useControlFilter` with searchText filters controls list correctly by control_id and measure_description
    - Observe: Calling `setLevel('ALTO')` in `useAuditState` preserves all existing `controlStates` (evidence, comments, statuses) — verified via localStorage snapshot before/after
    - Observe: PieChart distribution counts only controls for the selected level
  - **Write property-based tests using fast-check**:
    - **Text without references**: For all generated strings that do NOT contain ENS control ID patterns (`/\b(org|op\.pl|mp\.sw)\.\d+/`) or CPSTIC keywords, verify output is plain text nodes only (no `<Link>` or `<a>` elements)
    - **Sub-identifier preservation**: For all generated bracket patterns like `[org.1.1.a]`, `[op.pl.2.1]` that don't match a top-level control_id in the dataset, verify they render as `<span class="requisitos-boe__identifier">` (NOT as navigable links)
    - **Audit data preservation on level change**: For all generated audit states (random controlStates with statuses from ['Pendiente','Conforme','No conforme','No aplica'], comments as fc.string(), evidenceLinks as arrays), verify that calling `setLevel(newLevel)` preserves all control data unchanged
    - **Filter behavior preservation**: For all generated search strings (fc.string()), verify `useControlFilter` returns only controls whose `control_id` or `measure_description` includes the search text (case-insensitive)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.7_

- [ ] 3. Fix for ENS UX Improvements

  - [ ] 3.1 Remove dark theme from `src/index.css`
    - Delete the entire `@media (prefers-color-scheme: dark) { ... }` block (lines with --text: #9ca3af through closing brace)
    - Change `color-scheme: light dark` to `color-scheme: light` in `:root`
    - All CSS custom properties remain at their light-mode values (--bg: #fff, --text: #6b6375, --text-h: #08060d)
    - _Bug_Condition: isBugCondition(input) where input.type == "view_page" AND userPrefersColorScheme == "dark"_
    - _Expected_Behavior: --bg always resolves to #fff regardless of system preference_
    - _Preservation: Light mode CSS custom properties unchanged; --accent, --border etc. consistent_
    - _Requirements: 2.4, 3.5_

  - [ ] 3.2 Add `removeLevel()` to `src/services/StorageService.ts`
    - Add method to StorageService class: `removeLevel(): void { localStorage.removeItem(KEYS.level); }`
    - This enables clearing the saved level before navigating to the selector
    - Write unit test: after saveLevel('MEDIO') then removeLevel(), getLevel() returns null
    - _Bug_Condition: isBugCondition(input) where input.type == "click_change_level" AND storageService.getLevel() != null_
    - _Expected_Behavior: After removeLevel(), getLevel() returns null allowing LevelSelector to display_
    - _Preservation: All other storage keys (auditState, controlPrefix) unchanged_
    - _Requirements: 2.5_

  - [ ] 3.3 Fix level change redirect loop in `src/pages/ControlListPage.tsx` and `src/App.tsx`
    - In ControlListPage: update `handleChangeLevel()` to call `storageService.removeLevel()` before `navigate('/')`
    - In App.tsx: add `/select-level` route that always renders LevelSelector (bypasses HomePage redirect check)
    - Alternative: just clearing the level suffices since HomePage already checks getLevel() and shows selector when null
    - Test full flow: "Cambiar nivel" → level cleared → HomePage shows LevelSelector → user picks new level → navigates to /controls
    - _Bug_Condition: navigate('/') causes redirect loop because HomePage sees saved level and redirects to /controls_
    - _Expected_Behavior: Level cleared → LevelSelector renders → user selects new level without loop_
    - _Preservation: Audit data (controlStates) preserved; selecting new level only updates level field_
    - _Requirements: 2.5, 3.6_

  - [ ] 3.4 Create `src/utils/textParser.tsx` - Text parsing utility
    - Create regex for ENS control IDs: `/\b(org|op\.pl|op\.acc|op\.exp|op\.ext|op\.nub|op\.cont|op\.mon|mp\.if|mp\.per|mp\.eq|mp\.com|mp\.si|mp\.sw|mp\.info|mp\.s)\.\d+\b/gi`
    - Detect bracketed form with: `/\[([^\]]+)\]/g`
    - Create regex for CPSTIC/CCN: `/\b(CPSTIC|CCN-STIC[-\s]?\d*)\b/gi`
    - Logic: for each match check if ID exists in `validControlIds` set → render `<Link to={"/controls/" + id}>`. If not in set → render highlighted `<span>`. For CPSTIC → render `<a href="https://ens.ccn.cni.es/es/herramientas-de-apoyo/cpstic" target="_blank" rel="noopener noreferrer">`
    - Export `parseENSText(text: string, validControlIds: Set<string>): ReactNode[]`
    - Export `<ENSTextRenderer text={string} validControlIds={Set<string>} />` component
    - _Bug_Condition: textContainsControlReference(text) OR textContainsCPSTICReference(text)_
    - _Expected_Behavior: Control refs → Link elements; CPSTIC refs → external <a> elements_
    - _Preservation: Text without patterns renders unchanged; sub-identifiers not in set render as <span>_
    - _Requirements: 2.1, 2.2, 3.1, 3.4_

  - [ ] 3.5 Modify `src/components/RequisitosBOE.tsx` - Use ENSTextRenderer
    - Replace `highlightIdentifiers()` function with `ENSTextRenderer` component
    - Load valid control IDs from `controlsService.loadControls()` creating `Set<string>` of all `control_id` values
    - Pass `validControlIds` to `ENSTextRenderer` for each paragraph
    - Preserve existing section structure, empty state, `aria-labelledby` accessibility, paragraph splitting
    - _Bug_Condition: RequisitosBOE renders all bracket content as <span> regardless of whether it's a navigable control_
    - _Expected_Behavior: Valid cross-references become <Link>, sub-identifiers stay as <span>, CPSTIC becomes external link_
    - _Preservation: Section structure, empty state handling, CSS classes unchanged_
    - _Requirements: 2.1, 2.2, 3.1_

  - [ ] 3.6 Create `src/components/GlobalSearch.tsx` - Persistent search component
    - Text input with autocomplete dropdown searching all controls by `control_id` and `name`
    - On result selection: navigate to `/controls/{id}` using `useNavigate()`
    - Keyboard accessible: arrow keys + Enter for selection, Escape to close dropdown
    - Debounced filtering (150ms) for performance
    - Styled with BEM naming and CSS custom properties (--border, --bg, --accent)
    - _Bug_Condition: isBugCondition(input) where input.type == "search" AND input.currentPage != "ControlListPage"_
    - _Expected_Behavior: Search bar visible on all pages; can find and navigate to any control_
    - _Requirements: 2.3_

  - [ ] 3.7 Create `src/components/AppLayout.tsx` - Two-panel layout with sidebar
    - Shell component wrapping authenticated routes using React Router `<Outlet />`
    - Header: app title, level badge, "Cambiar nivel" button (calls `storageService.removeLevel()` + navigates to `/select-level`), GlobalSearch
    - Two-panel flexbox: left sidebar (~300px, scrollable) with controls list grouped by category + status indicators; main area with `<Outlet />` for detail content
    - Active control highlighted in sidebar based on `useParams()` from current route
    - Collapse/expand toggle for sidebar; responsive: sidebar hidden below 1024px
    - Use `useControlFilter` hook for sidebar filtering
    - _Bug_Condition: isBugCondition(input) where input.type == "view_controls" AND wantsSideBySideLayout_
    - _Expected_Behavior: Sidebar with controls list + main panel with detail visible simultaneously_
    - _Preservation: FilterBar search works in sidebar; deep-linking still works; ProtectedRoute guard preserved_
    - _Requirements: 2.3, 2.5, 2.6, 3.2, 3.3_

  - [ ] 3.8 Modify `src/App.tsx` - Integrate AppLayout and new routes
    - Add `/select-level` route rendering LevelSelector (always shows, no redirect check)
    - Wrap `/controls` and `/controls/:id` routes inside `<Route element={<AppLayout />}>` using nested routes
    - Keep `ProtectedRoute` logic for authenticated routes
    - Preserve catch-all `*` → Navigate to `/`
    - _Bug_Condition: Separate routes for /controls and /controls/:id require full-page navigation_
    - _Expected_Behavior: Nested routes render within AppLayout; sidebar + detail coexist_
    - _Preservation: Deep-linking, ProtectedRoute, existing redirects unchanged_
    - _Requirements: 2.5, 2.6, 3.3_

  - [ ] 3.9 Modify `src/pages/ControlListPage.tsx` - Extract sidebar content
    - Remove full-page header and "Cambiar nivel" button (now in AppLayout header)
    - Remove `handleChangeLevel` function (logic moved to AppLayout)
    - Keep controls list rendering, FilterBar, PieChart, ExportImportButtons as page content
    - The sidebar in AppLayout will use a compact controls list; ControlListPage remains for the main landing view
    - _Preservation: Grouping by category, status display, card rendering, filter logic preserved_
    - _Requirements: 2.6, 3.2_

  - [ ] 3.10 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - UX Defects Resolved
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior for all 6 bug conditions
    - When this test passes, it confirms:
      - Control references render as navigable `<Link>` elements
      - CPSTIC references render as external `<a>` elements
      - Global search is present on all pages
      - Theme is always light regardless of system preference
      - "Cambiar nivel" reaches the LevelSelector without redirect loop
      - Sidebar layout shows list + detail simultaneously
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.11 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Bug Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm: text without patterns still renders as plain text
    - Confirm: sub-identifiers still render as highlighted `<span>`
    - Confirm: audit data preserved on level change
    - Confirm: FilterBar filtering still works correctly
    - Confirm: PieChart statistics correct for selected level

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npx vitest --run`
  - Ensure all property-based tests (bug condition + preservation) pass
  - Ensure all existing unit tests still pass (CommentField, ComplianceStatusSelector, ControlCard, ErrorMessage, EvidenceSection, FilterBar, PieChart, RefuerzosList, RequisitosBOE, etc.)
  - Ensure no TypeScript compilation errors
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3.1", "3.2", "3.4", "3.6"],
    ["3.3", "3.5", "3.7"],
    ["3.8", "3.9"],
    ["3.10", "3.11"],
    ["4"]
  ]
}
```

## Notes

- Property-based tests use `fast-check` (already in project devDependencies)
- Test runner is `vitest` — use `npx vitest --run` for single execution (not watch mode)
- The text parser utility (3.4) is the core shared component for bugs 1.1 and 1.2
- The CSS fix (3.1) and StorageService change (3.2) are quick wins that can be done immediately
- The AppLayout (3.7) is the most complex change as it restructures the app shell
- The level change fix (3.2 + 3.3) is independent of text parsing and can proceed in parallel
- Responsive behavior: sidebar visible ≥1024px width; below that, full-page navigation preserved
