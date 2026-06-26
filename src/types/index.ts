// Niveles ENS
export type NivelENS = 'BÁSICO' | 'MEDIO' | 'ALTO';

// Estados de cumplimiento
export type ComplianceStatus = 'Pendiente' | 'En progreso' | 'Cumplido' | 'No aplica';

// Tabla de aplicabilidad por nivel
export interface Applicability {
  basica: string; // "aplica", "n.a.", o "+ R1", "+ R1 + R2", etc.
  media: string;
  alta: string;
}

// Refuerzo de un control ENS
export interface Refuerzo {
  id: string;         // e.g. "R1", "R2"
  name: string;       // Nombre descriptivo del refuerzo
  description: string; // Texto completo del BOE describiendo el refuerzo
}

// Control ENS (desde ens_complete_controls.json)
export interface ControlENS {
  control_id: string;           // e.g. "org.1", "op.pl.1"
  name: string;                 // Nombre del control
  category: string;             // e.g. "org", "op.pl", "op.acc"
  category_name: string;        // e.g. "Marco organizativo", "Planificación"
  group: string;                // e.g. "org", "op", "mp"
  dimensions: string;           // Dimensiones de seguridad
  applicability: Applicability; // Tabla de aplicabilidad por nivel
  requisitos_base: string;      // Texto oficial del BOE con los requisitos del control
  refuerzos: Refuerzo[];        // Lista de refuerzos disponibles para este control
  documentation_guidance: string; // Guía de documentación requerida
  evidence_guidance: string;    // Guía de evidencias esperadas
  observation: string;          // Observaciones complementarias (CCN-STIC, etc.)
  measure_description: string;  // Descripción resumida de la medida
  evidence_examples?: string;   // Ejemplos concretos de evidencias válidas para auditoría
}

// Medida técnica (desde medidas_tecnicas.json)
export interface MedidaTecnica {
  id: string;
  element: string;
  controls_ens: string; // IDs separados por "; "
  technical_measure: string;
  strategic_observation: string;
  technical_observation: string;
  responsible: string;
  evidence_type: string;
  status: string;
  ticket: string;
  control_status: string;
  last_review: string;
}

// Evidencia URL almacenada en localStorage
export interface EvidenceLink {
  id: string;
  controlId: string;
  url: string;
  label: string;
  addedAt: string; // ISO datetime
}

// Evidencia fichero almacenada en IndexedDB
export interface EvidenceFile {
  id: string;
  controlId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
  addedAt: string; // ISO datetime
}

// Estado de un control en la auditoría
export interface ControlAuditState {
  controlId: string;
  status: ComplianceStatus;
  comment: string;
  evidenceLinks: EvidenceLink[];
  responsible?: string; // Responsable asignado (ej: "Infraestructuras", "Security", "Cloud")
}

// Estado global de la auditoría (localStorage)
export interface AuditState {
  level: NivelENS;
  controls: Record<string, ControlAuditState>;
  lastModified: string; // ISO datetime
}

// Distribución para el pie chart
export interface ProgressDistribution {
  pendiente: number;
  enProgreso: number;
  cumplido: number;
  noAplica: number;
  total: number;
}

// Archivo de exportación
export interface ExportData {
  version: string;
  exportDate: string;
  level: NivelENS;
  controls: Record<string, ControlAuditState>;
}

// Opciones de filtrado
export interface FilterOptions {
  searchText: string;
  category: string | null;
  sortBy: 'category' | 'control_id' | 'status';
  sortDirection: 'asc' | 'desc';
}
