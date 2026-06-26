# Implementation Plan: ENS Audit Checklist

## Overview

Implementación de una SPA React + Vite + TypeScript que sirve como guía/checklist para auditoría ENS. Trabaja exclusivamente con `ens_complete_controls.json` (73 controles oficiales del Anexo II RD 311/2022). Sin backend, persiste en localStorage/IndexedDB. Interfaz en español.

## Tasks

- [x] 1. Configuración inicial del proyecto y tipos base
  - [x] 1.1 Definir tipos e interfaces TypeScript
    - Crear/actualizar `src/types/index.ts` con todos los tipos: `NivelENS`, `ComplianceStatus`, `Applicability`, `Refuerzo`, `ControlENS`, `EvidenceLink`, `EvidenceFile`, `ControlAuditState`, `AuditState`, `ProgressDistribution`, `ExportData`, `FilterOptions`
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [x] 1.2 Configurar estructura de directorios y dependencias
    - Asegurar estructura `src/services/`, `src/hooks/`, `src/components/`, `src/pages/`, `src/data/`
    - Instalar dependencia para pie chart (e.g. `recharts` o similar ligera)
    - Configurar vitest si no está configurado
    - _Requirements: 6.1_

  - [x] 1.3 Copiar fichero de datos estáticos
    - Copiar `contexto/ens_complete_controls.json` a `src/data/ens_complete_controls.json`
    - Crear `src/data/index.ts` que exporta el JSON tipado como `ControlENS[]`
    - _Requirements: 2.1_

- [x] 2. Implementar capa de servicios
  - [x] 2.1 Implementar StorageService
    - Crear `src/services/StorageService.ts` con la interfaz `IStorageService`
    - Implementar operaciones localStorage: `getAuditState`, `saveAuditState`, `getLevel`, `saveLevel`, `getControlState`, `saveControlState`, `isStorageAvailable`
    - Implementar operaciones IndexedDB: `saveFile`, `getFile`, `getFilesByControl`, `deleteFile`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 2.2 Write property tests for StorageService
    - **Property 2: Level persistence round-trip**
    - **Property 9: File evidence round-trip**
    - **Property 11: Comment persistence round-trip**
    - **Property 12: Compliance status persistence round-trip**
    - **Validates: Requirements 1.3, 4.2, 4.3, 5.2, 5.3, 7.1, 7.2**

  - [x] 2.3 Implementar ControlsService
    - Crear `src/services/ControlsService.ts` con la interfaz `IControlsService`
    - Implementar `loadControls()`: carga del JSON estático
    - Implementar `filterByLevel()`: filtrar controles por applicability[levelKey] !== "n.a."
    - Implementar `filterByText()`: filtro case-insensitive por control_id o measure_description
    - Implementar `filterByCategory()`: filtro por categoría exacta
    - Implementar `sortControls()`: ordenación por category, control_id, o status
    - Implementar `getCategories()`: extrae categorías únicas
    - Implementar `getApplicableRefuerzos()`: extrae refuerzos obligatorios del string applicability
    - _Requirements: 1.2, 2.1, 2.3, 2.4, 2.5_

  - [x] 2.4 Write property tests for ControlsService
    - **Property 1: Level filter correctness**
    - **Property 4: Category grouping correctness**
    - **Property 5: Text filter soundness and completeness**
    - **Property 6: Category filter soundness**
    - **Property 7: Sort ordering correctness**
    - **Validates: Requirements 1.2, 2.1, 2.3, 2.4, 2.5**

  - [x] 2.5 Implementar ExportImportService
    - Crear `src/services/ExportImportService.ts` con la interfaz `IExportImportService`
    - Implementar `exportAuditData()`: serializa AuditState a ExportData
    - Implementar `generateFilename()`: formato `auditoria-ens-{nivel}-{YYYY-MM-DD}.json`
    - Implementar `downloadAsJson()`: trigger descarga en navegador
    - Implementar `parseImportFile()`: parsea JSON string a ExportData
    - Implementar `validateImportData()`: valida estructura del fichero importado
    - Implementar `mergeImportedData()`: merge/replace de datos importados
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 2.6 Write property tests for ExportImportService
    - **Property 15: Export/Import round-trip**
    - **Property 16: Export filename format**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 3. Checkpoint - Servicios completados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar custom hooks
  - [x] 4.1 Implementar useLocalStorage hook
    - Crear `src/hooks/useLocalStorage.ts`
    - Lectura/escritura genérica a localStorage con manejo de errores
    - Detectar localStorage no disponible y exponer estado de error
    - _Requirements: 7.1, 7.4_

  - [x] 4.2 Implementar useIndexedDB hook
    - Crear `src/hooks/useIndexedDB.ts`
    - Operaciones CRUD asíncronas sobre IndexedDB para ficheros de evidencia
    - Manejo de errores cuando IndexedDB no está disponible
    - _Requirements: 7.2, 7.4_

  - [x] 4.3 Implementar useAuditState hook
    - Crear `src/hooks/useAuditState.ts`
    - Estado global: nivel seleccionado, estados de cumplimiento por control, comentarios, evidencias
    - Integración con StorageService para persistencia automática
    - Función para cambiar nivel preservando datos existentes
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.4 Implementar useControlFilter hook
    - Crear `src/hooks/useControlFilter.ts`
    - Gestión de estado de filtros (texto, categoría, ordenación)
    - Integración con ControlsService para aplicar filtros
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 4.5 Implementar useProgressStats hook
    - Crear `src/hooks/useProgressStats.ts`
    - Cálculo de ProgressDistribution basado en controles aplicables al nivel actual
    - Recalcular automáticamente cuando cambia un estado de cumplimiento
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 4.6 Write property tests for useProgressStats
    - **Property 13: Progress distribution sum invariant**
    - **Property 14: Progress counts only level-applicable controls**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 5. Checkpoint - Hooks completados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar componentes UI
  - [x] 6.1 Implementar LevelSelector page
    - Crear `src/pages/LevelSelector.tsx`
    - Mostrar tres opciones: BÁSICO, MEDIO, ALTO
    - Al seleccionar, guardar nivel y navegar a la lista de controles
    - Textos en español
    - _Requirements: 1.1, 8.1_

  - [x] 6.2 Implementar FilterBar component
    - Crear `src/components/FilterBar.tsx`
    - Campo de búsqueda con placeholder en español
    - Selector de categoría (dropdown con categorías únicas)
    - Selector de ordenación (categoría, control_id, estado)
    - Mensaje "No se encontraron controles" cuando no hay resultados
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 8.1_

  - [x] 6.3 Implementar ComplianceStatusSelector component
    - Crear `src/components/ComplianceStatusSelector.tsx`
    - Dropdown con opciones: Pendiente, En progreso, Cumplido, No aplica
    - Valor por defecto "Pendiente"
    - Callback onChange que persiste inmediatamente
    - _Requirements: 5.1, 5.2, 5.4, 8.1_

  - [x] 6.4 Implementar ControlCard component
    - Crear `src/components/ControlCard.tsx`
    - Mostrar: control_id, name, measure_description, estado de cumplimiento
    - Indicador visual del estado
    - Click para navegar al detalle
    - _Requirements: 2.2, 8.2_

  - [x] 6.5 Implementar PieChart component
    - Crear `src/components/PieChart.tsx`
    - Gráfico circular con segmentos por estado (Pendiente, En progreso, Cumplido, No aplica)
    - Mostrar porcentaje en cada segmento
    - Actualización reactiva cuando cambian estados
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.6 Implementar EvidenceSection component
    - Crear `src/components/EvidenceSection.tsx`
    - Formulario para añadir URL (con validación) y fichero (con validación de tamaño ≤ 5MB)
    - Lista de evidencias existentes con opción de eliminar
    - Ficheros con nombre original y enlace para descargar/ver
    - Mensajes de error en español
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1_

  - [x] 6.7 Write property test for URL validation
    - **Property 8: URL validation correctness**
    - **Validates: Requirements 3.2**

  - [x] 6.8 Implementar CommentField component
    - Crear `src/components/CommentField.tsx`
    - Textarea para comentarios/observaciones
    - Auto-guardado en localStorage al perder foco o tras debounce
    - Restauración del comentario al montar el componente
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1_

  - [x] 6.9 Implementar RequisitosBOE component
    - Crear `src/components/RequisitosBOE.tsx`
    - Renderizar texto completo de `requisitos_base` con formato legible
    - Resaltar identificadores de requisitos (e.g. `[org.1.1]`)
    - _Requirements: 2.2, 8.2_

  - [x] 6.10 Implementar RefuerzosList component
    - Crear `src/components/RefuerzosList.tsx`
    - Recibir control y nivel, llamar a `getApplicableRefuerzos()`
    - Mostrar ID, nombre y descripción de cada refuerzo aplicable
    - Indicación visual si refuerzo es obligatorio vs alternativo (formato `[R1 o R2]`)
    - Lista vacía si no hay refuerzos aplicables
    - _Requirements: 1.2, 8.2_

  - [x] 6.11 Implementar ExportImportButtons component
    - Crear `src/components/ExportImportButtons.tsx`
    - Botón "Exportar" que descarga JSON con nombre descriptivo
    - Botón "Importar" que abre file picker y procesa el fichero
    - Mensaje de error en español si formato inválido
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 8.1_

  - [x] 6.12 Implementar ErrorMessage component
    - Crear `src/components/ErrorMessage.tsx`
    - Componente genérico para mostrar errores en español
    - Variantes: inline (campo), toast (pantalla), crítico (bloqueo)
    - _Requirements: 7.4, 8.1_

- [x] 7. Checkpoint - Componentes completados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integración de páginas y enrutamiento
  - [x] 8.1 Implementar ControlListPage
    - Crear `src/pages/ControlListPage.tsx`
    - Integrar FilterBar, ControlCard (lista), PieChart, ExportImportButtons
    - Integrar useAuditState, useControlFilter, useProgressStats
    - Agrupar controles por categoría con encabezados
    - Mecanismo para cambiar nivel (botón en header)
    - _Requirements: 1.4, 2.1, 2.2, 6.1, 6.2_

  - [x] 8.2 Implementar ControlDetailPage
    - Crear `src/pages/ControlDetailPage.tsx`
    - Integrar: ComplianceStatusSelector, RequisitosBOE, RefuerzosList, EvidenceSection, CommentField
    - Mostrar guía de documentación y evidencias (`documentation_guidance`, `evidence_guidance`)
    - Mostrar medida resumida (`measure_description`) y observaciones (`observation`)
    - Navegación de vuelta a la lista
    - _Requirements: 3.1, 4.1, 5.1, 8.2_

  - [x] 8.3 Configurar enrutamiento y App principal
    - Actualizar `src/App.tsx` con rutas: `/` (LevelSelector o redirect), `/controls` (lista), `/controls/:id` (detalle)
    - Instalar react-router-dom si no está disponible
    - Lógica de redirect: si nivel ya seleccionado, ir directo a `/controls`
    - _Requirements: 1.1, 1.3_

  - [x] 8.4 Write property test for level change preserving data
    - **Property 3: Level change preserves audit data**
    - **Validates: Requirements 1.5**

  - [x] 8.5 Write property test for evidence removal
    - **Property 10: Evidence removal completeness**
    - **Validates: Requirements 3.5**

- [x] 9. Final checkpoint - Aplicación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- La única fuente de datos de controles es `ens_complete_controls.json` (73 controles Anexo II)
- No existe MedidasService ni medidas_tecnicas.json en esta versión
- El lenguaje de implementación es TypeScript (React + Vite)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["4.6"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.8", "6.9", "6.10", "6.11", "6.12"] },
    { "id": 6, "tasks": ["6.7"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 8, "tasks": ["8.4", "8.5"] }
  ]
}
```
