# ENS UX Improvements Bugfix Design

## Overview

This design addresses six usability defects in the ENS audit application that impact auditor productivity. The defects range from non-interactive cross-references (plain text where links should exist), missing navigation patterns (global search, sidebar layout), a broken level-change flow (redirect loop), and a dark theme that hinders readability during extended audit sessions.

The fix strategy is minimally invasive: each defect is addressed with targeted changes to existing components and services, preserving the current data model, routing structure, and audit state management. The largest architectural change is converting the list/detail flow from separate routes to a sidebar+panel layout on desktop viewports.

## Glossary

- **Bug_Condition (C)**: The set of conditions across the six defects where the UI fails to provide expected interactivity, navigation, or visual clarity
- **Property (P)**: The expected correct behavior — clickable references, working navigation, legible theme, functional level change, sidebar layout
- **Preservation**: Existing audit data persistence, filter behavior, route handling for direct URLs, component rendering, and accessibility must remain unchanged
- **control_id**: The dot-notation identifier for an ENS control (e.g., `org.1`, `op.pl.5`, `mp.sw.1`)
- **requisitos_base**: BOE official text for a control, may contain cross-references to other controls in bracket notation like `[op.pl.5]`
- **CPSTIC**: Catálogo de Productos y Servicios de las Tecnologías de la Información y la Comunicación (CCN catalog referenced in control observations)
- **NivelENS**: Security level type (`BÁSICO` | `MEDIO` | `ALTO`) stored in localStorage

## Bug Details

### Bug Condition

The bugs manifest across six scenarios where the application fails to provide expected interactivity or correct behavior. The common thread is missing UI affordances that auditors need for efficient workflow.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction
  OUTPUT: boolean

  RETURN (
    // Defect 1.1: Cross-reference text is not clickable
    (input.type == 'VIEW_TEXT'
      AND textContainsControlReference(input.text)
      AND NOT referenceIsClickable(input.text))
    OR
    // Defect 1.2: External CPSTIC/CCN references are not linked
    (input.type == 'VIEW_TEXT'
      AND textContainsCPSTICReference(input.text)
      AND NOT referenceIsExternalLink(input.text))
    OR
    // Defect 1.3: No global search available on detail page
    (input.type == 'SEARCH_ATTEMPT'
      AND input.currentPage == 'ControlDetailPage'
      AND NOT globalSearchAvailable())
    OR
    // Defect 1.4: Dark theme applied reducing legibility
    (input.type == 'PAGE_LOAD'
      AND systemPrefersDarkScheme()
      AND applicationUsesDarkTheme())
    OR
    // Defect 1.5: Cambiar nivel redirects back immediately
    (input.type == 'CLICK_CAMBIAR_NIVEL'
      AND storageService.getLevel() != null
      AND navigateTo('/') causes redirect to '/controls')
    OR
    // Defect 1.6: No sidebar layout, full-page navigation required
    (input.type == 'VIEW_CONTROL_DETAIL'
      AND viewportWidth >= 1024
      AND NOT sidebarLayoutRendered())
  )
END FUNCTION
```

### Examples

- **Defect 1.1**: User views `op.nub.1` detail, sees text mentioning `[op.pl.5]` rendered as a highlighted `<span>` but cannot click it to navigate to `op.pl.5` detail page
- **Defect 1.2**: User views `mp.sw.1` observation mentioning "catálogo CPSTIC del CCN" — no link to https://ens.ccn.cni.es/es/herramientas-de-apoyo/cpstic is rendered
- **Defect 1.3**: User is on `/controls/op.acc.4` and wants to find `mp.info.1` — must click "← Volver a la lista", scroll to FilterBar, type the search, click the result
- **Defect 1.4**: User with macOS dark mode enabled sees muted gray text (#9ca3af) on dark background (#16171d) during 2-hour audit session — reduced contrast causes eye strain
- **Defect 1.5**: User clicks "Cambiar nivel" → navigates to `/` → `HomePage` reads `storageService.getLevel()` → returns `'MEDIO'` → `<Navigate to="/controls">` → stuck
- **Defect 1.6**: User clicks `org.1` card on `/controls` → full navigation to `/controls/org.1` → loses context of list position → clicks "← Volver" → must scroll back to position

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse clicks on ControlCard components continue to work (though target changes from page navigation to sidebar selection on desktop)
- FilterBar search/category/sort on ControlListPage continues to filter controls identically
- All audit data (compliance statuses, comments, evidence links, evidence files) persists unchanged through level changes
- PieChart and progress statistics continue to count only controls applicable to the current level
- Direct URL navigation to `/controls/:id` continues to work (loads detail in panel or full page on mobile)
- RequisitosBOE continues to render sub-identifiers of the current control (e.g., `[org.1.1]` within `org.1`) as highlighted spans without turning them into links
- CSS custom properties continue to provide consistent styling across components
- Export/import functionality remains unaffected

**Scope:**
All interactions not related to the six defects should be completely unaffected. This includes:
- Evidence file upload/download via IndexedDB
- ComplianceStatusSelector behavior
- CommentField behavior
- RefuerzosList rendering
- ExportImportButtons functionality

## Hypothesized Root Cause

Based on the code analysis, the root causes are:

1. **Defect 1.1 — Missing link rendering in RequisitosBOE**: The `IDENTIFIER_REGEX` in `RequisitosBOE.tsx` matches bracket patterns like `[op.pl.5]` but wraps them in a `<span>` element instead of an `<a>` or button that navigates to `/controls/op.pl.5`. The component has no awareness of valid control IDs or navigation capability.

2. **Defect 1.2 — No external link detection**: No component currently scans text for CPSTIC/CCN-STIC references. The observation and guidance text fields are rendered as plain `<p>` elements without any link parsing.

3. **Defect 1.3 — Search component scoped to ControlListPage**: `FilterBar` only exists within `ControlListPage`. There is no global/persistent search component mounted at the App level or shared layout.

4. **Defect 1.4 — `@media (prefers-color-scheme: dark)` in index.css**: The CSS explicitly overrides all custom properties when the system prefers dark scheme. There is no user toggle or forced light mode.

5. **Defect 1.5 — HomePage redirect logic**: In `App.tsx`, `HomePage` checks `storageService.getLevel()` and immediately returns `<Navigate to="/controls">` if any level exists. The `handleChangeLevel` function in `ControlListPage` simply calls `navigate('/')` without clearing the stored level first — creating the redirect loop.

6. **Defect 1.6 — Full page navigation pattern**: The routing uses separate `/controls` and `/controls/:id` routes that render entirely different page components. There is no layout component that renders the list and detail side-by-side.

## Correctness Properties

Property 1: Bug Condition - Cross-references become clickable links

_For any_ control text (requisitos_base, observation, measure_description, or refuerzo description) containing a reference to another valid control_id in bracket notation (e.g., `[op.pl.5]`), the fixed RequisitosBOE and text-rendering components SHALL render those references as clickable links that navigate to the referenced control's detail view.

**Validates: Requirements 2.1**

Property 2: Bug Condition - External CPSTIC/CCN references become links

_For any_ control text containing references to "CPSTIC", "CCN-STIC", or "catálogo" with CCN context, the fixed text-rendering components SHALL render those references as external links opening in a new tab pointing to the official CCN resource URL.

**Validates: Requirements 2.2**

Property 3: Bug Condition - Global search is accessible from all pages

_For any_ page in the application (ControlListPage or ControlDetailPage), the fixed layout SHALL display a persistent global search bar that allows searching for controls and navigating directly to matching results.

**Validates: Requirements 2.3**

Property 4: Bug Condition - Light theme is always applied

_For any_ page load regardless of the user's `prefers-color-scheme` setting, the fixed application SHALL render using the light theme (white background, dark text) to maximize legibility during audit sessions.

**Validates: Requirements 2.4**

Property 5: Bug Condition - Cambiar nivel flow works correctly

_For any_ click on "Cambiar nivel" while a level is already saved in storage, the fixed application SHALL clear the saved level, navigate to the level selector, allow the user to pick a new level, and then navigate to the controls view filtered by the new level — preserving all existing audit data.

**Validates: Requirements 2.5**

Property 6: Bug Condition - Sidebar layout renders on desktop

_For any_ viewport width ≥ 1024px when the user is on the controls page, the fixed application SHALL display a two-panel layout with a scrollable sidebar listing controls on the left and the control detail view in the main area, allowing control selection without full-page navigation.

**Validates: Requirements 2.6**

Property 7: Preservation - Sub-identifiers remain non-clickable

_For any_ text within requisitos_base that contains requirement sub-identifiers of the current control (e.g., `[org.1.1]` within control `org.1`), the fixed code SHALL continue to render them as highlighted spans without converting them to navigable links.

**Validates: Requirements 3.1**

Property 8: Preservation - FilterBar and routing continue working

_For any_ search/filter/sort interaction on the controls page and any direct URL navigation, the fixed code SHALL produce the same filtering results and routing behavior as the original code.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

**File**: `src/index.css`

**Defect 1.4 — Remove dark theme media query**

1. **Remove `@media (prefers-color-scheme: dark)` block**: Delete the entire media query that overrides CSS custom properties for dark mode. The application will always use the light `:root` values.
2. **Preserve**: Keep the `color-scheme: light dark` declaration changed to `color-scheme: light` to signal to browsers that only light mode is used.

---

**File**: `src/components/RequisitosBOE.tsx`

**Defect 1.1 — Make cross-references clickable**

1. **Add control_id list prop or context**: Pass the list of valid control IDs (or a lookup function) to determine whether a bracket reference is a navigable control.
2. **Modify `highlightIdentifiers`**: When a matched `[identifier]` corresponds to a valid control_id (different from the current control), render an `<a>` or `<Link>` element instead of a `<span>`. For sub-identifiers of the current control, continue rendering `<span>`.
3. **Add navigation**: Use react-router-dom `<Link to={`/controls/${controlId}`}>` for internal cross-references.

**Defect 1.2 — Link external CPSTIC/CCN references**

4. **Add external reference regex**: Detect patterns like "catálogo CPSTIC", "guía CCN-STIC-XXX", "CCN-STIC" and wrap them in `<a href="https://ens.ccn.cni.es/es/herramientas-de-apoyo/cpstic" target="_blank" rel="noopener noreferrer">`.
5. **Apply to all text-rendering locations**: The same linkification logic should apply to `observation`, `measure_description`, `documentation_guidance`, and `evidence_guidance` fields.

---

**File**: `src/components/TextWithLinks.tsx` (NEW)

**Shared text rendering component**

1. **Create utility component**: A new `TextWithLinks` component that accepts text content, the current control_id, and a list of valid control_ids. It handles:
   - Cross-reference detection and linking (defect 1.1)
   - External reference detection and linking (defect 1.2)
   - Sub-identifier highlighting without linking (preservation 3.1)
2. **Export regex patterns**: `CONTROL_REF_REGEX` for `[op.pl.5]` patterns, `EXTERNAL_REF_REGEX` for CPSTIC/CCN patterns.

---

**File**: `src/components/GlobalSearchBar.tsx` (NEW)

**Defect 1.3 — Global search component**

1. **Create GlobalSearchBar component**: A search input with typeahead/autocomplete that searches all controls by `control_id` and `name`.
2. **Use `controlsService.filterByText`** for filtering.
3. **Show dropdown results**: Display matching controls with their ID and name, allowing direct navigation.
4. **Use `useNavigate`** to navigate to the selected control's detail.

---

**File**: `src/components/AppLayout.tsx` (NEW)

**Defect 1.3 + 1.6 — Shared layout with global search and sidebar**

1. **Create layout wrapper**: Renders the global search bar at the top, the sidebar on the left (desktop), and the main content area.
2. **Responsive behavior**: On viewports ≥ 1024px, render sidebar + detail side by side. On smaller viewports, maintain current behavior (full-page navigation).
3. **Sidebar content**: Render the filtered controls list (using the same `useControlFilter` hook) in a scrollable panel.

---

**File**: `src/App.tsx`

**Defect 1.5 — Fix "Cambiar nivel" redirect loop**

1. **Add `/select-level` route**: Create a dedicated route that always renders `LevelSelector`, bypassing the saved-level check.
2. **Modify `ControlListPage`**: Change `handleChangeLevel` to call `storageService.saveLevel` with null/clear, then navigate to `/select-level` (or clear level before navigating to `/`).
3. **Alternative approach (simpler)**: Modify `handleChangeLevel` in `ControlListPage` to clear the stored level via a new `storageService.clearLevel()` method before navigating to `/`. Then `HomePage` will correctly show `LevelSelector` since `getLevel()` returns null.

**Defect 1.6 — Integrate sidebar layout**

4. **Wrap protected routes with `AppLayout`**: The `/controls` and `/controls/:id` routes should be nested under a layout route that provides the sidebar.
5. **Use Outlet or children pattern**: The sidebar selects a control, the main area renders `ControlDetailPage` content.

---

**File**: `src/services/StorageService.ts`

**Defect 1.5 — Add clearLevel method**

1. **Add `clearLevel()` method**: `localStorage.removeItem(KEYS.level)` to allow the HomePage redirect logic to work correctly after clearing.

---

**File**: `src/pages/ControlListPage.tsx`

**Defect 1.5 — Update handleChangeLevel**

1. **Call `storageService.clearLevel()`** before `navigate('/')` so that `HomePage` shows the selector.

**Defect 1.6 — Adapt for sidebar use**

2. **Extract control list rendering** into a reusable component (`ControlsSidebar`) that can be rendered within the sidebar panel.
3. **On desktop**: Control clicks update a selected control state (via URL param or local state) instead of full navigation.

---

**File**: `src/pages/ControlDetailPage.tsx`

**Defect 1.1 + 1.2 — Use TextWithLinks for text rendering**

1. **Replace plain `<p>` rendering** of `measure_description`, `observation`, `documentation_guidance`, and `evidence_guidance` with `<TextWithLinks>` component.
2. **Pass `controlId` and valid control IDs** to enable cross-reference linking and sub-identifier preservation.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests for each defect that exercise the buggy code paths. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Cross-reference rendering test**: Render `RequisitosBOE` with text containing `[op.pl.5]` and assert a clickable link exists → will fail on unfixed code (renders as span)
2. **CPSTIC link test**: Render control detail with observation mentioning "catálogo CPSTIC" and assert an external link exists → will fail on unfixed code (plain text)
3. **Global search presence test**: Render `ControlDetailPage` and assert a search input exists → will fail on unfixed code (no search on detail page)
4. **Theme test**: Load app with `prefers-color-scheme: dark` and assert `--bg` is `#fff` → will fail on unfixed code (applies dark values)
5. **Level change test**: Simulate clicking "Cambiar nivel" when level is saved and assert LevelSelector renders → will fail on unfixed code (redirects back)
6. **Sidebar layout test**: Render controls page at 1024px width and assert sidebar panel exists → will fail on unfixed code (no sidebar)

**Expected Counterexamples**:
- `RequisitosBOE` renders all `[identifier]` patterns as `<span>` regardless of whether they reference other controls
- No external link detection exists anywhere in the codebase
- `FilterBar` is only rendered within `ControlListPage` component tree
- `index.css` applies dark overrides unconditionally on system dark preference
- `navigate('/')` triggers `HomePage` which redirects back to `/controls`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderFixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Specific assertions:**
- Cross-references to valid control IDs render as `<Link>` elements with correct `to` prop
- CPSTIC references render as `<a>` with `target="_blank"` and correct href
- GlobalSearchBar is present in DOM on all pages
- CSS `--bg` variable resolves to `#fff` regardless of system preference
- Clicking "Cambiar nivel" removes stored level and shows LevelSelector
- Desktop viewport shows sidebar with controls list alongside detail panel

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) == fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code for filtering, routing, data persistence, and text rendering. Then write property-based tests capturing that behavior.

**Test Cases**:
1. **FilterBar preservation**: Verify that `useControlFilter` produces identical results for any combination of searchText, category, and sortBy after the fix
2. **Sub-identifier preservation**: Verify that bracket patterns that are sub-identifiers of the current control (e.g., `[org.1.1]` in `org.1`) remain as `<span>` elements, not links
3. **Audit data preservation**: Verify that changing the level preserves all existing control audit states (statuses, comments, evidence links)
4. **Route preservation**: Verify that direct URL access to `/controls/org.1` continues to render the correct control detail
5. **Component rendering preservation**: Verify that `ComplianceStatusSelector`, `EvidenceSection`, `CommentField`, `RefuerzosList` render identically before and after changes

### Unit Tests

- Test `TextWithLinks` renders cross-references as links when control_id exists in valid list
- Test `TextWithLinks` renders sub-identifiers as spans when they are children of current control
- Test `TextWithLinks` renders CPSTIC references as external links
- Test `GlobalSearchBar` filters controls and navigates on selection
- Test `StorageService.clearLevel()` removes the level key from localStorage
- Test `handleChangeLevel` clears level before navigation
- Test sidebar renders control list and updates detail on selection
- Test light theme CSS values are applied regardless of media query

### Property-Based Tests

- Generate random control text with mixed references (valid IDs, sub-IDs, external refs) and verify correct link/span classification
- Generate random filter combinations (searchText × category × sortBy) and verify `useControlFilter` output matches expected results
- Generate random audit states and verify level change preserves all control data
- Generate random viewport widths and verify correct layout rendering (sidebar vs. full-page)

### Integration Tests

- Test full flow: load app → select level → view controls → click cross-reference → navigate to referenced control
- Test full flow: click "Cambiar nivel" → see LevelSelector → select new level → controls re-filter
- Test full flow: type in global search → see results → click result → detail loads
- Test sidebar: click control in sidebar → detail renders → click another → detail updates without full navigation
- Test responsive: resize below 1024px → sidebar collapses → navigation returns to full-page pattern
