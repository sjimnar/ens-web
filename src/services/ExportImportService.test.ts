import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportImportService } from './ExportImportService';
import type { AuditState, ExportData, NivelENS } from '@/types';

describe('ExportImportService', () => {
  let service: ExportImportService;

  beforeEach(() => {
    service = new ExportImportService();
  });

  const createMockAuditState = (level: NivelENS = 'MEDIO'): AuditState => ({
    level,
    controls: {
      'org.1': {
        controlId: 'org.1',
        status: 'Cumplido',
        comment: 'Comentario de prueba',
        evidenceLinks: [],
      },
      'op.pl.1': {
        controlId: 'op.pl.1',
        status: 'En progreso',
        comment: '',
        evidenceLinks: [
          { id: '1', controlId: 'op.pl.1', url: 'https://example.com', label: 'Evidencia', addedAt: '2024-01-01T00:00:00.000Z' },
        ],
      },
    },
    lastModified: '2024-06-15T10:30:00.000Z',
  });

  describe('exportAuditData', () => {
    it('debe serializar el estado de auditoría a ExportData', () => {
      const state = createMockAuditState();
      const result = service.exportAuditData(state);

      expect(result.version).toBe('1.0');
      expect(result.exportDate).toBeDefined();
      expect(result.level).toBe('MEDIO');
      expect(result.controls).toEqual(state.controls);
    });

    it('debe incluir la fecha de exportación en formato ISO', () => {
      const state = createMockAuditState();
      const result = service.exportAuditData(state);

      // Verify it's a valid ISO date
      expect(() => new Date(result.exportDate)).not.toThrow();
      expect(new Date(result.exportDate).toISOString()).toBe(result.exportDate);
    });
  });

  describe('generateFilename', () => {
    it('debe generar nombre con nivel BÁSICO sin acento', () => {
      const date = new Date('2024-06-15T00:00:00.000Z');
      const filename = service.generateFilename('BÁSICO', date);
      expect(filename).toBe('auditoria-ens-basico-2024-06-15.json');
    });

    it('debe generar nombre con nivel MEDIO en minúscula', () => {
      const date = new Date('2024-03-01T00:00:00.000Z');
      const filename = service.generateFilename('MEDIO', date);
      expect(filename).toBe('auditoria-ens-medio-2024-03-01.json');
    });

    it('debe generar nombre con nivel ALTO en minúscula', () => {
      const date = new Date('2025-12-31T00:00:00.000Z');
      const filename = service.generateFilename('ALTO', date);
      expect(filename).toBe('auditoria-ens-alto-2025-12-31.json');
    });
  });

  describe('downloadAsJson', () => {
    it('debe crear un elemento anchor y disparar la descarga', () => {
      const createObjectURL = vi.fn(() => 'blob:mock-url');
      const revokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        (node as HTMLAnchorElement).click = clickSpy;
        return node;
      });
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      const data: ExportData = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'MEDIO',
        controls: {},
      };

      service.downloadAsJson(data, 'test-file.json');

      expect(createObjectURL).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });

  describe('parseImportFile', () => {
    it('debe parsear JSON válido de exportación', () => {
      const exportData: ExportData = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'ALTO',
        controls: { 'org.1': { controlId: 'org.1', status: 'Cumplido', comment: '', evidenceLinks: [] } },
      };
      const content = JSON.stringify(exportData);

      const result = service.parseImportFile(content);
      expect(result).toEqual(exportData);
    });

    it('debe retornar null para JSON inválido', () => {
      const result = service.parseImportFile('esto no es json{{{');
      expect(result).toBeNull();
    });

    it('debe retornar null para JSON válido con estructura incorrecta', () => {
      const result = service.parseImportFile(JSON.stringify({ foo: 'bar' }));
      expect(result).toBeNull();
    });

    it('debe retornar null para string vacío', () => {
      const result = service.parseImportFile('');
      expect(result).toBeNull();
    });
  });

  describe('validateImportData', () => {
    it('debe aceptar datos con estructura correcta', () => {
      const data = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'BÁSICO',
        controls: {},
      };
      expect(service.validateImportData(data)).toBe(true);
    });

    it('debe rechazar null', () => {
      expect(service.validateImportData(null)).toBe(false);
    });

    it('debe rechazar datos sin version', () => {
      const data = { exportDate: '2024-06-15', level: 'MEDIO', controls: {} };
      expect(service.validateImportData(data)).toBe(false);
    });

    it('debe rechazar datos sin exportDate', () => {
      const data = { version: '1.0', level: 'MEDIO', controls: {} };
      expect(service.validateImportData(data)).toBe(false);
    });

    it('debe rechazar datos con nivel inválido', () => {
      const data = { version: '1.0', exportDate: '2024-06-15', level: 'INVALIDO', controls: {} };
      expect(service.validateImportData(data)).toBe(false);
    });

    it('debe rechazar datos sin controls', () => {
      const data = { version: '1.0', exportDate: '2024-06-15', level: 'ALTO' };
      expect(service.validateImportData(data)).toBe(false);
    });

    it('debe rechazar primitivos', () => {
      expect(service.validateImportData(42)).toBe(false);
      expect(service.validateImportData('string')).toBe(false);
      expect(service.validateImportData(undefined)).toBe(false);
    });
  });

  describe('mergeImportedData', () => {
    it('debe usar el nivel del archivo importado', () => {
      const existing = createMockAuditState('MEDIO');
      const imported: ExportData = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'ALTO',
        controls: {},
      };

      const result = service.mergeImportedData(existing, imported);
      expect(result.level).toBe('ALTO');
    });

    it('debe fusionar controles importados sobre los existentes', () => {
      const existing = createMockAuditState();
      const imported: ExportData = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'MEDIO',
        controls: {
          'org.1': { controlId: 'org.1', status: 'Pendiente', comment: 'Nuevo comentario', evidenceLinks: [] },
          'mp.if.1': { controlId: 'mp.if.1', status: 'Cumplido', comment: 'Nuevo control', evidenceLinks: [] },
        },
      };

      const result = service.mergeImportedData(existing, imported);

      // Imported overrides existing
      expect(result.controls['org.1'].status).toBe('Pendiente');
      expect(result.controls['org.1'].comment).toBe('Nuevo comentario');
      // Existing control not in import is preserved
      expect(result.controls['op.pl.1']).toEqual(existing.controls['op.pl.1']);
      // New control from import is added
      expect(result.controls['mp.if.1'].status).toBe('Cumplido');
    });

    it('debe actualizar lastModified', () => {
      const existing = createMockAuditState();
      const imported: ExportData = {
        version: '1.0',
        exportDate: '2024-06-15T00:00:00.000Z',
        level: 'MEDIO',
        controls: {},
      };

      const before = new Date().toISOString();
      const result = service.mergeImportedData(existing, imported);
      const after = new Date().toISOString();

      expect(result.lastModified >= before).toBe(true);
      expect(result.lastModified <= after).toBe(true);
    });
  });
});
