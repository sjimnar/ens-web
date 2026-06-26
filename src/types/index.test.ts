import { describe, it, expect } from 'vitest';
import type {
  NivelENS,
  ComplianceStatus,
  ControlENS,
  MedidaTecnica,
  EvidenceLink,
  EvidenceFile,
  AuditState,
  ProgressDistribution,
  ExportData,
  FilterOptions,
  Applicability,
  Refuerzo,
} from '@/types';

describe('TypeScript types', () => {
  it('NivelENS type accepts valid values', () => {
    const levels: NivelENS[] = ['BÁSICO', 'MEDIO', 'ALTO'];
    expect(levels).toHaveLength(3);
  });

  it('ComplianceStatus type accepts valid values', () => {
    const statuses: ComplianceStatus[] = ['Pendiente', 'En progreso', 'Cumplido', 'No aplica'];
    expect(statuses).toHaveLength(4);
  });

  it('ControlENS interface has required shape', () => {
    const control: ControlENS = {
      control_id: 'org.1',
      name: 'Política de seguridad',
      category: 'org',
      category_name: 'Marco organizativo',
      group: 'org',
      dimensions: 'Categoría',
      applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
      requisitos_base: 'Texto de requisitos',
      refuerzos: [],
      documentation_guidance: 'Documentación',
      evidence_guidance: 'Evidencias',
      observation: 'Observación',
      measure_description: 'Descripción de medida',
    };
    expect(control.control_id).toBe('org.1');
  });

  it('MedidaTecnica interface has required shape', () => {
    const medida: MedidaTecnica = {
      id: '1',
      element: 'Firewall',
      controls_ens: 'op.pl.1; op.acc.1',
      technical_measure: 'Configurar reglas',
      strategic_observation: 'Obs estratégica',
      technical_observation: 'Obs técnica',
      responsible: 'TI',
      evidence_type: 'Captura',
      status: 'Activo',
      ticket: 'TICKET-001',
      control_status: 'Cumplido',
      last_review: '2024-01-01',
    };
    expect(medida.controls_ens).toContain('op.pl.1');
  });

  it('AuditState interface has required shape', () => {
    const state: AuditState = {
      level: 'MEDIO',
      controls: {
        'org.1': {
          controlId: 'org.1',
          status: 'Cumplido',
          comment: 'Revisado',
          evidenceLinks: [],
        },
      },
      lastModified: new Date().toISOString(),
    };
    expect(state.level).toBe('MEDIO');
    expect(state.controls['org.1'].status).toBe('Cumplido');
  });

  it('ProgressDistribution interface has required shape', () => {
    const dist: ProgressDistribution = {
      pendiente: 10,
      enProgreso: 5,
      cumplido: 20,
      noAplica: 3,
      total: 38,
    };
    expect(dist.pendiente + dist.enProgreso + dist.cumplido + dist.noAplica).toBe(dist.total);
  });

  it('ExportData interface has required shape', () => {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      level: 'ALTO',
      controls: {},
    };
    expect(exportData.version).toBe('1.0');
  });

  it('FilterOptions interface has required shape', () => {
    const filters: FilterOptions = {
      searchText: '',
      category: null,
      sortBy: 'category',
      sortDirection: 'asc',
    };
    expect(filters.sortBy).toBe('category');
  });

  it('EvidenceLink interface has required shape', () => {
    const link: EvidenceLink = {
      id: 'link-1',
      controlId: 'org.1',
      url: 'https://example.com',
      label: 'Ejemplo',
      addedAt: new Date().toISOString(),
    };
    expect(link.url).toBe('https://example.com');
  });

  it('EvidenceFile interface has required shape', () => {
    const file: EvidenceFile = {
      id: 'file-1',
      controlId: 'org.1',
      filename: 'doc.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      data: new ArrayBuffer(1024),
      addedAt: new Date().toISOString(),
    };
    expect(file.filename).toBe('doc.pdf');
  });

  it('Applicability interface has required shape', () => {
    const app: Applicability = {
      basica: 'aplica',
      media: '+ R1',
      alta: '+ R1 + R2',
    };
    expect(app.basica).toBe('aplica');
  });

  it('Refuerzo interface has required shape', () => {
    const refuerzo: Refuerzo = {
      id: 'R1',
      name: 'Refuerzo 1',
      description: 'Descripción del refuerzo',
    };
    expect(refuerzo.id).toBe('R1');
  });
});
