# Design Document

## Overview

Este documento detalla la arquitectura y diseño técnico de la aplicación de checklist de auditoría ENS. Se trata de una SPA en React + Vite + TypeScript que funciona exclusivamente en el navegador, sin backend, persistiendo datos en localStorage e IndexedDB. La interfaz es exclusivamente en español.

La fuente de datos es `ens_complete_controls.json`, que contiene los 73 controles oficiales del Anexo II del RD 311/2022 con sus requisitos del BOE, 126 refuerzos, y tabla de aplicabilidad por nivel (BÁSICA/MEDIA/ALTA).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React App (Vite)                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │  Pages/     │  │  Components/ │  │  Hooks/        │   │  │
│  │  │  Views      │  │  UI Elements │  │  State Logic   │   │  │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  │         │                │                   │            │  │
│  │         └────────────────┼───────────────────┘            │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼───────────────────────────┐    │  │
│  │  │              Services Layer                        │    │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │    │  │
│  │  │  │ Storage  │  │ Controls │  │ Export/Import  │   │    │  │
│  │  │  │ Service  │  │ Service  │  │ Service        │   │    │  │
│  │  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘   │    │  │
│  │  └───────┼──────────────┼────────────────┼────────────┘    │  │
│  └──────────┼──────────────┼────────────────┼────────────────┘  │
│             │              │                │                    │
├─────────────▼──────────────▼────────────────▼────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ localStorage │  │ Static JSON      │  │ IndexedDB          │ │
│  │ (state data) │  │ (controls)       │  │ (file evidence)    │ │
│  │              │  │                  │  │                    │ │
│  └──────────────┘  └──────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

La aplicación sigue una arquitectura de capas:
1. **Capa de Presentación**: Páginas y componentes React
2. **Capa de Lógica**: Custom hooks y servicios
3. **Capa de Datos**: localStorage, IndexedDB y JSON estáticos

### Fuentes de datos estáticas

| Fichero | Contenido | Uso |
|---|---|---|
| `src/data/ens_complete_controls.json` | 73 controles Anexo II con requisitos BOE, 126 refuerzos, tabla de aplicabilidad | Fuente única de controles |

## Components and Interfaces

### Páginas principales

| Componente | Responsabilidad |
|---|---|
| `LevelSelector` | Pantalla inicial de selección de nivel ENS |
| `ControlListPage` | Vista principal con lista de controles, filtros y gráfico |
| `ControlDetailPage` | Vista detallada de un control con requisitos oficiales, refuerzos, evidencias y comentarios |

### Componentes UI

| Componente | Responsabilidad |
|---|---|
| `ControlCard` | Tarjeta resumen de un control (id, nombre, medida, estado) |
| `ComplianceStatusSelector` | Dropdown para seleccionar estado de cumplimiento |
| `FilterBar` | Barra con campo de búsqueda, selector de categoría y ordenación |
| `PieChart` | Gráfico circular de progreso |
| `EvidenceSection` | Sección para gestionar evidencias (URLs + ficheros) |
| `CommentField` | Campo de texto para comentarios/observaciones |
| `RequisitosBOE` | Sección que muestra los requisitos oficiales del BOE (requisitos_base) |
| `RefuerzosList` | Lista de refuerzos aplicables al nivel seleccionado |
| `ExportImportButtons` | Botones para exportar/importar datos |
| `ErrorMessage` | Componente genérico para mensajes de error en español |

### Custom Hooks

| Hook | Responsabilidad |
|---|---|
| `useAuditState` | Estado global: nivel, controles, filtros, estados de cumplimiento |
| `useLocalStorage` | Lectura/escritura genérica a localStorage con manejo de errores |
| `useIndexedDB` | Operaciones CRUD sobre IndexedDB para ficheros |
| `useControlFilter` | Lógica de filtrado y ordenación de controles |
| `useProgressStats` | Cálculo de estadísticas de progreso para el pie chart |

### Servicios

| Servicio | Responsabilidad |
|---|---|
| `StorageService` | Abstracción sobre localStorage e IndexedDB |
| `ControlsService` | Carga, filtrado por nivel/texto/categoría y ordenación de controles |
| `ExportImportService` | Serialización/deserialización del estado de auditoría |

## Data Models

### Tipos de datos principales

```typescript
// Niveles ENS
type NivelENS = 'BÁSICO' | 'MEDIO' | 'ALTO';

// Estados de cumplimiento
type ComplianceStatus = 'Pendiente' | 'En progreso' | 'Cumplido' | 'No aplica';

// Tabla de aplicabilidad por nivel
interface Applicability {
  basica: string; // "aplica", "n.a.", o "+ R1", "+ R1 + R2", etc.
  media: string;
  alta: string;
}

// Refuerzo de un control ENS
interface Refuerzo {
  id: string;       // e.g. "R1", "R2"
  name: string;     // Nombre descriptivo del refuerzo
  description: string; // Texto completo del BOE describiendo el refuerzo
}

// Control ENS (desde ens_complete_controls.json)
interface ControlENS {
  control_id: string;           // e.g. "org.1", "op.pl.1"
  name: string;                 // Nombre del control
  category: string;             // e.g. "org", "op.pl", "op.acc"
  category_name: string;        // e.g. "Marco organizativo", "Planificación"
  group: string;                // e.g. "org", "op", "mp"
  dimensions: string;           // Dimensiones de seguridad: "Categoría", "D", "C", "I", "T", "A"
  applicability: Applicability; // Tabla de aplicabilidad por nivel
  requisitos_base: string;      // Texto oficial del BOE con los requisitos del control
  refuerzos: Refuerzo[];        // Lista de refuerzos disponibles para este control
  documentation_guidance: string; // Guía de documentación requerida
  evidence_guidance: string;    // Guía de evidencias esperadas
  observation: string;          // Observaciones complementarias (CCN-STIC, etc.)
  measure_description: string;  // Descripción resumida de la medida
}

// Evidencia URL almacenada en localStorage
interface EvidenceLink {
  id: string;
  controlId: string;
  url: string;
  label: string;
  addedAt: string; // ISO datetime
}

// Evidencia fichero almacenada en IndexedDB
interface EvidenceFile {
  id: string;
  controlId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
  addedAt: string; // ISO datetime
}

// Estado de un control en la auditoría
interface ControlAuditState {
  controlId: string;
  status: ComplianceStatus;
  comment: string;
  evidenceLinks: EvidenceLink[];
}

// Estado global de la auditoría (localStorage)
interface AuditState {
  level: NivelENS;
  controls: Record<string, ControlAuditState>;
  lastModified: string; // ISO datetime
}

// Distribución para el pie chart
interface ProgressDistribution {
  pendiente: number;
  enProgreso: number;
  cumplido: number;
  noAplica: number;
  total: number;
}

// Archivo de exportación
interface ExportData {
  version: string;
  exportDate: string;
  level: NivelENS;
  controls: Record<string, ControlAuditState>;
}

// Opciones de filtrado
interface FilterOptions {
  searchText: string;
  category: string | null;
  sortBy: 'category' | 'control_id' | 'status';
  sortDirection: 'asc' | 'desc';
}
```

### Interfaz de StorageService

```typescript
interface IStorageService {
  // localStorage operations
  getAuditState(): AuditState | null;
  saveAuditState(state: AuditState): void;
  getLevel(): NivelENS | null;
  saveLevel(level: NivelENS): void;
  getControlState(controlId: string): ControlAuditState | null;
  saveControlState(controlId: string, state: ControlAuditState): void;
  isStorageAvailable(): boolean;

  // IndexedDB operations
  saveFile(file: EvidenceFile): Promise<void>;
  getFile(id: string): Promise<EvidenceFile | null>;
  getFilesByControl(controlId: string): Promise<EvidenceFile[]>;
  deleteFile(id: string): Promise<void>;
}
```

### Interfaz de ControlsService

```typescript
interface IControlsService {
  loadControls(): ControlENS[];
  filterByLevel(controls: ControlENS[], level: NivelENS): ControlENS[];
  filterByText(controls: ControlENS[], text: string): ControlENS[];
  filterByCategory(controls: ControlENS[], category: string): ControlENS[];
  sortControls(controls: ControlENS[], sortBy: string, direction: string): ControlENS[];
  getCategories(controls: ControlENS[]): string[];
  getApplicableRefuerzos(control: ControlENS, level: NivelENS): Refuerzo[];
}
```

### Interfaz de ExportImportService

```typescript
interface IExportImportService {
  exportAuditData(state: AuditState): ExportData;
  generateFilename(level: NivelENS, date: Date): string;
  downloadAsJson(data: ExportData, filename: string): void;
  parseImportFile(content: string): ExportData | null;
  validateImportData(data: unknown): data is ExportData;
  mergeImportedData(existing: AuditState, imported: ExportData): AuditState;
}
```

## Data Flow

### Flujo de selección de nivel

1. App se inicializa → `StorageService.getLevel()` busca nivel guardado
2. Si existe nivel → cargar controles filtrados directamente
3. Si no existe → mostrar `LevelSelector`
4. Usuario selecciona nivel → `StorageService.saveLevel()` → cargar controles filtrados

### Flujo de filtrado por nivel (filterByLevel)

La lógica de filtrado usa el campo `applicability` del control:

```typescript
function filterByLevel(controls: ControlENS[], level: NivelENS): ControlENS[] {
  const levelKey = levelToKey(level); // 'BÁSICO' → 'basica', 'MEDIO' → 'media', 'ALTO' → 'alta'
  return controls.filter(control => control.applicability[levelKey] !== 'n.a.');
}

function levelToKey(level: NivelENS): keyof Applicability {
  switch (level) {
    case 'BÁSICO': return 'basica';
    case 'MEDIO': return 'media';
    case 'ALTO': return 'alta';
  }
}
```

Un control aplica a un nivel si su valor de applicability NO es `"n.a."`. Los valores posibles son:
- `"aplica"` — el control aplica con requisitos base
- `"n.a."` — no aplica para este nivel
- `"+ R1"`, `"+ R1 + R2"`, etc. — aplica con refuerzos adicionales obligatorios

Controles por nivel:
- **BÁSICA**: 52 controles
- **MEDIA**: 68 controles
- **ALTA**: 73 controles (todos)

### Flujo de obtención de refuerzos aplicables

```typescript
function getApplicableRefuerzos(control: ControlENS, level: NivelENS): Refuerzo[] {
  const levelKey = levelToKey(level);
  const applicabilityValue = control.applicability[levelKey];

  if (applicabilityValue === 'n.a.' || applicabilityValue === 'aplica') {
    return [];
  }

  // Extraer IDs de refuerzos del string de applicability: "+ R1 + R2" → ["R1", "R2"]
  const refuerzoIds = parseApplicabilityRefuerzos(applicabilityValue);
  return control.refuerzos.filter(r => refuerzoIds.includes(r.id));
}

function parseApplicabilityRefuerzos(value: string): string[] {
  // Extrae IDs como "R1", "R2", etc. del string de applicability
  // Maneja formatos: "+ R1", "+ R1 + R2", "+ [R1 o R2] + R3"
  const matches = value.match(/R\d+/g);
  return matches ?? [];
}
```

Nota: Algunos controles tienen formato alternativo como `"+ [R2 o R3]"` indicando que se debe cumplir al menos uno de los refuerzos listados entre corchetes. La UI mostrará todos los refuerzos referenciados con una indicación de si son alternativos (`o`) u obligatorios todos (`+`).

### Flujo de cambio de estado de cumplimiento

1. Usuario cambia estado en `ComplianceStatusSelector`
2. Hook `useAuditState` actualiza estado local
3. `StorageService.saveControlState()` persiste en localStorage
4. Hook `useProgressStats` recalcula distribución
5. `PieChart` re-renderiza con nueva distribución

### Flujo de evidencia tipo fichero

1. Usuario selecciona fichero en `EvidenceSection`
2. Validación de tamaño (≤ 5MB)
3. Si válido → `StorageService.saveFile()` almacena en IndexedDB
4. Metadatos del fichero se guardan en `ControlAuditState.evidenceLinks` (localStorage)
5. UI se actualiza mostrando el fichero añadido

### Flujo de exportación/importación

1. **Export**: `ExportImportService.exportAuditData()` → `generateFilename()` → `downloadAsJson()`
2. **Import**: Leer fichero → `parseImportFile()` → `validateImportData()` → `mergeImportedData()` → `StorageService.saveAuditState()`

## Control Detail Page Layout

La página de detalle de un control (`ControlDetailPage`) muestra la siguiente información en este orden:

1. **Cabecera**: `control_id`, `name`, `category_name`, dimensiones
2. **Estado de cumplimiento**: `ComplianceStatusSelector`
3. **Requisitos oficiales del BOE** (`RequisitosBOE`):
   - Texto completo de `requisitos_base` formateado con identificadores de requisitos resaltados (e.g., `[org.1.1]`)
4. **Refuerzos aplicables** (`RefuerzosList`):
   - Solo los refuerzos que aplican al nivel actual (determinado por `applicability[level]`)
   - Cada refuerzo muestra su ID, nombre y descripción completa
   - Indicación visual si el refuerzo es obligatorio vs. alternativo
5. **Guía de documentación y evidencias**:
   - `documentation_guidance`: qué documentación se espera
   - `evidence_guidance`: qué evidencias presentar
6. **Medida resumida**: `measure_description`
7. **Observaciones**: `observation` (referencias CCN-STIC, etc.)
8. **Evidencias del auditor** (`EvidenceSection`): URLs y ficheros adjuntos por el usuario
9. **Comentarios** (`CommentField`): Observaciones del auditor

## Error Handling

| Escenario | Estrategia |
|---|---|
| localStorage lleno o no disponible | Mostrar `ErrorMessage` en español, impedir operaciones de escritura |
| IndexedDB no disponible | Mostrar `ErrorMessage`, deshabilitar upload de ficheros |
| Fichero > 5MB | Rechazar con mensaje descriptivo en español |
| URL mal formada | Mostrar error inline en el campo de URL |
| Fichero de importación inválido | Mostrar error sin modificar datos existentes |
| JSON estático no encontrado | Mostrar error crítico con instrucciones |
| Filtro sin resultados | Mostrar mensaje informativo "No se encontraron controles" |

Todos los mensajes de error se muestran exclusivamente en español.

## URL Validation

```typescript
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
```

## Progress Calculation

```typescript
function calculateProgress(
  controls: ControlENS[],
  auditStates: Record<string, ControlAuditState>
): ProgressDistribution {
  const distribution: ProgressDistribution = {
    pendiente: 0,
    enProgreso: 0,
    cumplido: 0,
    noAplica: 0,
    total: controls.length,
  };

  for (const control of controls) {
    const state = auditStates[control.control_id];
    const status = state?.status ?? 'Pendiente';
    switch (status) {
      case 'Pendiente': distribution.pendiente++; break;
      case 'En progreso': distribution.enProgreso++; break;
      case 'Cumplido': distribution.cumplido++; break;
      case 'No aplica': distribution.noAplica++; break;
    }
  }

  return distribution;
}
```

## Export Filename Format

```typescript
function generateFilename(level: NivelENS, date: Date): string {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `auditoria-ens-${level.toLowerCase()}-${dateStr}.json`;
}
```

## Category Hierarchy

Los 73 controles del Anexo II se organizan en las siguientes categorías:

| Categoría | Nombre | Grupo | Controles |
|---|---|---|---|
| `org` | Marco organizativo | org | 4 |
| `op.pl` | Planificación | op | 5 |
| `op.acc` | Control de acceso | op | 6 |
| `op.exp` | Explotación | op | 10 |
| `op.ext` | Servicios externos | op | 4 |
| `op.nub` | Servicios en la nube | op | 1 |
| `op.cont` | Continuidad del servicio | op | 4 |
| `op.mon` | Monitorización del sistema | op | 3 |
| `mp.if` | Protección de las instalaciones | mp | 7 |
| `mp.per` | Gestión del personal | mp | 4 |
| `mp.eq` | Protección de los equipos | mp | 4 |
| `mp.com` | Protección de las comunicaciones | mp | 4 |
| `mp.si` | Protección de los soportes de información | mp | 5 |
| `mp.sw` | Protección de las aplicaciones informáticas | mp | 2 |
| `mp.info` | Protección de la información | mp | 6 |
| `mp.s` | Protección de los servicios | mp | 4 |

Adicionalmente, las categorías se agrupan en tres grandes bloques:
- **org**: Marco organizativo
- **op**: Marco operacional
- **mp**: Medidas de protección

Nota: La categoría "Articulos" (artículos del RD 311/2022 que no son controles del Anexo II) puede añadirse en futuras versiones como sección informativa complementaria.

## Testing Strategy

### Tests unitarios (example-based)
- Verificar que el selector de nivel muestra las tres opciones (BÁSICO, MEDIO, ALTO)
- Verificar que cada tarjeta de control muestra control_id, name, measure y status
- Verificar que la sección de requisitos BOE se renderiza en el detalle
- Verificar que los refuerzos aplicables se muestran correctamente por nivel
- Verificar que la sección de evidencias se renderiza en el detalle
- Verificar que el campo de comentario existe en el detalle
- Verificar que los cuatro estados de cumplimiento están disponibles
- Verificar que todos los textos UI están en español
- Verificar que los datos del JSON se muestran sin transformar su texto original

### Tests de propiedades (property-based)
- Cada propiedad del apartado "Correctness Properties" se implementa como test con al menos 100 iteraciones
- Se generan inputs aleatorios: strings para filtros, niveles ENS, estados de cumplimiento, listas de controles
- Se validan invariantes, round-trips y relaciones metamórficas

### Tests de edge-case
- Fichero > 5MB rechazado con mensaje en español
- Filtro sin resultados muestra mensaje informativo
- Control sin refuerzos muestra lista vacía
- Control con refuerzos alternativos (`[R1 o R2]`) muestra indicación
- localStorage no disponible muestra error
- Importación de fichero inválido no modifica datos existentes
- Control sin estado guardado tiene "Pendiente" por defecto



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Level filter correctness

*For any* valid NivelENS and list of ControlENS entries with applicability data, the `filterByLevel` function shall return only controls where `applicability[levelKey] !== "n.a."`, and no control with `applicability[levelKey] === "n.a."` shall be included in the result.

**Validates: Requirements 1.2**

### Property 2: Level persistence round-trip

*For any* valid NivelENS value, saving it to localStorage and then reading it back shall produce the same level value.

**Validates: Requirements 1.3, 7.1**

### Property 3: Level change preserves audit data

*For any* existing AuditState with evidence and comments, changing the NivelENS shall preserve all ControlAuditState entries (statuses, comments, evidence links) without deletion or modification.

**Validates: Requirements 1.5**

### Property 4: Category grouping correctness

*For any* list of ControlENS entries, after grouping by category, every control within a group shall have exactly the same category value as the group key.

**Validates: Requirements 2.1**

### Property 5: Text filter soundness and completeness

*For any* search string and list of ControlENS entries, the text filter shall return exactly those controls whose `control_id` or `measure_description` contains the search string (case-insensitive). No matching control shall be excluded, and no non-matching control shall be included.

**Validates: Requirements 2.3**

### Property 6: Category filter soundness

*For any* selected category and list of ControlENS entries, the category filter shall return only controls with that exact category, and all controls of that category shall be included.

**Validates: Requirements 2.4**

### Property 7: Sort ordering correctness

*For any* list of ControlENS entries and valid sort field (category, control_id, status), the sorted output shall be in non-decreasing order according to the specified field when sorting ascending.

**Validates: Requirements 2.5**

### Property 8: URL validation correctness

*For any* string input, the URL validator shall return true if and only if the string is a well-formed URL (parseable by the URL constructor).

**Validates: Requirements 3.2**

### Property 9: File evidence round-trip

*For any* valid file (≤5MB), storing it in IndexedDB and retrieving it by its ID shall produce a file with identical filename, mimeType, size, and data content.

**Validates: Requirements 3.3, 7.2**

### Property 10: Evidence removal completeness

*For any* control with one or more evidence items, after removing a specific evidence item, querying storage for that item's ID shall return null/undefined.

**Validates: Requirements 3.5**

### Property 11: Comment persistence round-trip

*For any* valid comment string and control ID, persisting the comment and then reading it back shall return the identical string.

**Validates: Requirements 4.2, 4.3**

### Property 12: Compliance status persistence round-trip

*For any* valid ComplianceStatus value and control ID, persisting the status and then reading it back shall return the identical status value.

**Validates: Requirements 5.2, 5.3**

### Property 13: Progress distribution sum invariant

*For any* set of controls with assigned compliance statuses, the sum of all distribution segments (pendiente + enProgreso + cumplido + noAplica) shall equal the total number of controls in the set.

**Validates: Requirements 6.1, 6.3**

### Property 14: Progress counts only level-applicable controls

*For any* NivelENS selection and full control set, the progress distribution total shall equal the count of controls where `applicability[levelKey] !== "n.a."`, not the total 73 controls.

**Validates: Requirements 6.4**

### Property 15: Export/Import round-trip

*For any* valid AuditState, exporting to JSON and then importing the resulting file shall produce an AuditState equivalent to the original (same level, same statuses, same comments, same evidence links).

**Validates: Requirements 10.1, 10.3**

### Property 16: Export filename format

*For any* valid NivelENS and Date, the generated export filename shall contain the level name (lowercased) and the date in YYYY-MM-DD format.

**Validates: Requirements 10.2**
