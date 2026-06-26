# Bugfix Requirements Document

## Introduction

La aplicación de auditoría ENS presenta varias deficiencias de usabilidad que afectan la productividad del auditor. Las referencias cruzadas entre controles (e.g., `[op.pl.5]` mencionado en el texto de `op.nub.1`) aparecen como texto plano sin posibilidad de navegar directamente al control referenciado. Las referencias a guías externas como el catálogo CPSTIC no proporcionan enlace de acceso. No existe una barra de búsqueda global accesible desde cualquier vista de la aplicación. La aplicación usa un tema oscuro por defecto que reduce la legibilidad. El layout actual requiere ir y volver entre la lista y el detalle sin vista simultánea. Además, el botón "Cambiar nivel" no funciona correctamente — al navegar a `/` la app redirige inmediatamente de vuelta a `/controls` porque el nivel ya está guardado en localStorage y no se borra antes de mostrar el selector.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a control's text (requisitos_base, observation, measure_description, or refuerzo description) contains a reference to another control using the pattern `[op.pl.5]` or plain text like `op.pl.5` THEN the system renders it as plain, non-interactive text without any navigation capability

1.2 WHEN a control's text references the CPSTIC catalog or other external CCN resources (e.g., "catálogo CPSTIC del CCN", "guía CCN-STIC") THEN the system renders these references as plain text without providing a link or tooltip to access the external resource

1.3 WHEN the user is on the ControlDetailPage and wants to search for another control by name or code THEN the system provides no search mechanism — the user must navigate back to the list page to use the FilterBar search field

1.4 WHEN the user's system has `prefers-color-scheme: dark` enabled THEN the system applies a dark theme (dark background #16171d, muted text colors) that reduces legibility for extended document review and audit work

1.5 WHEN the user clicks "Cambiar nivel" to change the ENS level THEN the app navigates to `/` which immediately redirects back to `/controls` because `HomePage` checks `storageService.getLevel()` — which returns the already-saved level — and performs a `<Navigate to="/controls">` redirect. The user can never reach the LevelSelector screen after the initial selection. Root cause: `HomePage` in `App.tsx` always redirects if any level is saved, and neither the "Cambiar nivel" handler in `ControlListPage` nor `HomePage` clears the saved level before showing the selector.

1.6 WHEN the user wants to view the details of a control THEN they must navigate away from the controls list to a separate page (`/controls/:id`), losing sight of the controls navigation. There is no sidebar or panel showing the controls list alongside the detail view, requiring constant back-and-forth navigation between list and detail.

### Expected Behavior (Correct)

2.1 WHEN a control's text contains a reference to another control (pattern `[op.pl.5]` or plain-text references like `op.pl.5`, `mp.sw.1`, `org.1`) THEN the system SHALL render those references as clickable links that navigate to the detail page of the referenced control (`/controls/:id`)

2.2 WHEN a control's text references the CPSTIC catalog or CCN-STIC guides THEN the system SHALL render those references as external links pointing to the official CCN resource (https://ens.ccn.cni.es/es/herramientas-de-apoyo/cpstic) opening in a new tab, or at minimum provide a tooltip/popover with the URL

2.3 WHEN the user is on any page of the application (ControlListPage or ControlDetailPage) THEN the system SHALL display a persistent global search bar that allows searching for controls by control_id or name and navigating directly to the matching control

2.4 WHEN the application is loaded THEN the system SHALL use a light/clear theme as default (light background, dark text) regardless of the user's system color-scheme preference, to maximize legibility during extended audit sessions

2.5 WHEN the user clicks "Cambiar nivel" THEN the system SHALL navigate to the level selection screen showing the three level options (BÁSICO, MEDIO, ALTO), allowing the user to select a new level. The system SHALL either clear the saved level before navigating or provide a dedicated route/state (e.g., `/select-level`) that always shows the selector regardless of saved state. After selecting a new level, the system SHALL update both `useAuditState` and `storageService` with the new level and navigate back to the controls view filtered by the new level, preserving all existing audit data.

2.6 WHEN the user is on the controls page THEN the system SHALL display a two-panel layout: a collapsible sidebar/navigation panel on the left showing the list of controls (grouped by category, with status indicators), and the control detail view in the main/center area. Clicking a control in the sidebar SHALL load its detail in the center panel without a full page navigation. The sidebar SHALL be scrollable independently and SHALL support collapsing/expanding for smaller screens.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN text within requisitos_base contains requirement identifiers in brackets (e.g., `[org.1.1]`, `[op.pl.2.1]`) that are sub-identifiers of the current control (not references to other controls) THEN the system SHALL CONTINUE TO render them as highlighted spans without converting them into navigable links

3.2 WHEN the FilterBar on ControlListPage is used to search by text THEN the system SHALL CONTINUE TO filter the control list by control_id or measure_description as it currently does

3.3 WHEN the user navigates between controls using existing links (← Volver a la lista, control cards) THEN the system SHALL CONTINUE TO route correctly between /controls and /controls/:id

3.4 WHEN the application renders control data (requisitos_base, refuerzos, documentation_guidance, evidence_guidance, observation) THEN the system SHALL CONTINUE TO display the original Spanish text content without altering its meaning or structure

3.5 WHEN CSS custom properties (--accent, --accent-bg, --border, etc.) are used by existing components THEN the system SHALL CONTINUE TO apply consistent styling across all components after the theme change

3.6 WHEN the user changes the NivelENS THEN the system SHALL CONTINUE TO preserve all existing evidence, comments, and compliance statuses — no audit data shall be lost during a level change

3.7 WHEN the PieChart and progress statistics are displayed THEN the system SHALL CONTINUE TO count only controls applicable to the currently selected level
