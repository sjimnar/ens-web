# Requirements Document

## Introduction

Aplicación web SPA ligera y moderna (React + Vite) que sirve como guía/checklist para recopilar evidencias y preparar la auditoría del Esquema Nacional de Seguridad (ENS). La aplicación trabaja exclusivamente con los 73 controles oficiales del Anexo II del RD 311/2022 (fuente BOE, fichero `ens_complete_controls.json`) incluyendo sus requisitos base, refuerzos, tabla de aplicabilidad por nivel, guía de documentación y guía de evidencias. Funciona exclusivamente en el navegador del usuario sin backend, persiste el progreso en localStorage/IndexedDB y permite adjuntar enlaces y ficheros pequeños como evidencia por cada control. La interfaz es exclusivamente en español.

## Glossary

- **App**: La aplicación web SPA construida con React + Vite que constituye el sistema principal.
- **Control_ENS**: Cada uno de los controles del Esquema Nacional de Seguridad que deben evaluarse durante la auditoría. Se cargan desde un fichero JSON estático.
- **Nivel_ENS**: Nivel de seguridad del sistema a auditar: BÁSICO, MEDIO o ALTO. Determina qué controles y refuerzos aplican.
- **Categoría**: Agrupación funcional de los controles ENS (org, op.pl, op.acc, op.exp, op.ext, op.nub, op.cont, op.mon, mp.if, mp.per, mp.eq, mp.com, mp.si, mp.sw, mp.info, mp.s, Articulos).
- **Evidencia**: Enlace URL o fichero adjunto que demuestra el cumplimiento de un control.
- **Selector_Nivel**: Componente de la interfaz que permite al usuario elegir el nivel ENS al inicio.
- **Gráfico_Progreso**: Gráfico de tipo tarta (pie chart) que muestra el porcentaje de cumplimiento de la autoauditoría.
- **localStorage**: API del navegador utilizada para persistir datos estructurados de progreso.
- **IndexedDB**: API del navegador utilizada para almacenar ficheros codificados como evidencia.

## Requirements

### Requirement 1: Selección de nivel ENS

**User Story:** Como auditor interno, quiero seleccionar el nivel ENS (BÁSICO, MEDIO o ALTO) al iniciar la aplicación, para que solo se muestren los controles y refuerzos aplicables a mi sistema.

#### Acceptance Criteria

1. WHEN the App is opened for the first time, THE Selector_Nivel SHALL display the three options BÁSICO, MEDIO and ALTO and require the user to select one before accessing the checklist.
2. WHEN the user selects a Nivel_ENS, THE App SHALL filter and display only the Control_ENS entries applicable to the selected level.
3. WHEN the user has previously selected a Nivel_ENS and reopens the App, THE App SHALL restore the previously selected level from localStorage without prompting again.
4. WHEN the user wants to change the Nivel_ENS after initial selection, THE App SHALL provide a mechanism accessible from the main interface to change the level.
5. IF the user changes the Nivel_ENS, THEN THE App SHALL update the visible controls to match the new level while preserving all existing evidence and comments.

### Requirement 2: Listado y navegación de controles

**User Story:** Como auditor interno, quiero ver la lista completa de controles ENS organizados por categoría, para poder navegar y localizar cada control de forma eficiente.

#### Acceptance Criteria

1. THE App SHALL load Control_ENS data from the static JSON file and display them grouped by Categoría.
2. THE App SHALL display for each Control_ENS at minimum: control_id, measure description, and compliance status.
3. WHEN the user applies a text filter, THE App SHALL display only controls whose control_id or measure contain the search text, case-insensitive.
4. WHEN the user selects a Categoría filter, THE App SHALL display only controls belonging to the selected Categoría.
5. THE App SHALL allow sorting controls by Categoría, control_id, or compliance status.
6. WHEN no controls match the active filters, THE App SHALL display a message indicating no results found.

### Requirement 3: Gestión de evidencias por control

**User Story:** Como auditor interno, quiero asociar enlaces y ficheros a cada control como evidencia, para demostrar el cumplimiento durante la auditoría.

#### Acceptance Criteria

1. WHEN the user opens the detail of a Control_ENS, THE App SHALL display a section to add, view, and remove evidence items (links and files).
2. WHEN the user adds a URL as evidence, THE App SHALL validate that the value is a well-formed URL and store the link in localStorage associated to the Control_ENS.
3. WHEN the user uploads a file as evidence, THE App SHALL encode the file and store it in IndexedDB associated to the Control_ENS.
4. THE App SHALL display uploaded file evidence with the original filename and a mechanism to download or view the file.
5. WHEN the user removes an evidence item, THE App SHALL delete the item from localStorage or IndexedDB and update the display.
6. IF an uploaded file exceeds 5 MB, THEN THE App SHALL reject the upload and display an informative error message in Spanish.

### Requirement 4: Comentarios y observaciones por control

**User Story:** Como auditor interno, quiero añadir comentarios u observaciones a cada control, para registrar notas internas y contexto relevante para la auditoría.

#### Acceptance Criteria

1. WHEN the user opens the detail of a Control_ENS, THE App SHALL display a text field for comments/observations.
2. WHEN the user types in the comment field and navigates away, THE App SHALL persist the comment text in localStorage associated to the Control_ENS.
3. WHEN the user revisits a Control_ENS, THE App SHALL restore and display the previously saved comment.
4. THE App SHALL allow the user to edit or clear an existing comment at any time.

### Requirement 5: Seguimiento de estado de cumplimiento

**User Story:** Como auditor interno, quiero marcar el estado de cumplimiento de cada control, para realizar un seguimiento del progreso de la autoauditoría.

#### Acceptance Criteria

1. THE App SHALL provide a compliance status selector per Control_ENS with at minimum the values: Pendiente, En progreso, Cumplido, No aplica.
2. WHEN the user changes the compliance status of a Control_ENS, THE App SHALL persist the new status in localStorage immediately.
3. WHEN the App loads, THE App SHALL restore the previously saved compliance status for each Control_ENS.
4. THE App SHALL set the default compliance status of each Control_ENS to "Pendiente" when no saved state exists.

### Requirement 6: Gráfico de progreso

**User Story:** Como auditor interno, quiero ver un gráfico de tarta con el porcentaje de controles cumplidos, para evaluar rápidamente mi nivel de preparación para la auditoría.

#### Acceptance Criteria

1. THE Gráfico_Progreso SHALL display a pie chart showing the distribution of controls by compliance status (Pendiente, En progreso, Cumplido, No aplica).
2. WHEN the user changes the compliance status of any Control_ENS, THE Gráfico_Progreso SHALL update to reflect the new distribution without requiring a page reload.
3. THE Gráfico_Progreso SHALL display the percentage value for each segment.
4. THE Gráfico_Progreso SHALL only count controls applicable to the currently selected Nivel_ENS.

### Requirement 7: Persistencia local de datos

**User Story:** Como auditor interno, quiero que todo mi progreso se guarde automáticamente en el navegador, para no perder trabajo si cierro la pestaña o el navegador.

#### Acceptance Criteria

1. THE App SHALL persist all user data (level selection, compliance statuses, comments, evidence links) in localStorage automatically upon each change.
2. THE App SHALL persist file evidence in IndexedDB automatically upon upload.
3. WHEN the user opens the App after closing the browser, THE App SHALL restore all previously saved data including level, statuses, comments, and evidence.
4. IF localStorage or IndexedDB is unavailable or full, THEN THE App SHALL display an informative error message in Spanish indicating that data cannot be saved.

### Requirement 8: Interfaz en español

**User Story:** Como auditor interno hispanohablante, quiero que toda la interfaz esté en español, para no tener barreras de idioma al usar la aplicación.

#### Acceptance Criteria

1. THE App SHALL render all UI labels, buttons, messages, placeholders, and error messages exclusively in Spanish.
2. THE App SHALL display ENS control data (control_id, measure, documentation, evidence descriptions) in their original Spanish text from the source JSON.

### Requirement 9: Exportación de datos

**User Story:** Como auditor interno, quiero exportar el estado de mi autoauditoría para compartirlo con el equipo o archivarlo.

#### Acceptance Criteria

1. WHEN the user triggers the export action, THE App SHALL generate a JSON file containing all compliance statuses, comments, and evidence links for the selected Nivel_ENS.
2. THE App SHALL trigger a browser download of the generated export file with a descriptive filename including the date and level.
3. WHEN the user triggers the import action with a valid export file, THE App SHALL restore the data from the file, merging or replacing existing data as appropriate.
4. IF the imported file format is invalid, THEN THE App SHALL display an error message in Spanish without modifying existing data.
