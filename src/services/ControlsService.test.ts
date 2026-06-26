import { describe, it, expect } from 'vitest';
import { ControlsService, controlsService } from './ControlsService';
import type { ControlENS } from '@/types';

/**
 * Fixture factory para crear controles ENS de prueba.
 */
function makeControl(overrides: Partial<ControlENS> = {}): ControlENS {
  return {
    control_id: 'org.1',
    name: 'Política de seguridad',
    category: 'org',
    category_name: 'Marco organizativo',
    group: 'org',
    dimensions: 'Categoría',
    applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
    requisitos_base: 'Texto requisitos...',
    refuerzos: [],
    documentation_guidance: 'Guía documentación',
    evidence_guidance: 'Guía evidencias',
    observation: 'Observaciones',
    measure_description: 'Descripción de la medida',
    ...overrides,
  };
}

describe('ControlsService', () => {
  const service = new ControlsService();

  describe('loadControls()', () => {
    it('carga controles desde el JSON estático', () => {
      const controls = service.loadControls();
      expect(controls).toBeDefined();
      expect(Array.isArray(controls)).toBe(true);
      expect(controls.length).toBeGreaterThan(0);
    });

    it('cada control tiene los campos requeridos', () => {
      const controls = service.loadControls();
      const first = controls[0];
      expect(first.control_id).toBeDefined();
      expect(first.name).toBeDefined();
      expect(first.category).toBeDefined();
      expect(first.applicability).toBeDefined();
      expect(first.measure_description).toBeDefined();
    });
  });

  describe('filterByLevel()', () => {
    const controls: ControlENS[] = [
      makeControl({
        control_id: 'org.1',
        applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
      }),
      makeControl({
        control_id: 'op.pl.2',
        applicability: { basica: 'n.a.', media: 'aplica', alta: '+ R1' },
      }),
      makeControl({
        control_id: 'mp.com.3',
        applicability: { basica: 'n.a.', media: 'n.a.', alta: '+ R1 + R2' },
      }),
    ];

    it('filtra correctamente para nivel BÁSICO', () => {
      const result = service.filterByLevel(controls, 'BÁSICO');
      expect(result).toHaveLength(1);
      expect(result[0].control_id).toBe('org.1');
    });

    it('filtra correctamente para nivel MEDIO', () => {
      const result = service.filterByLevel(controls, 'MEDIO');
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.control_id)).toEqual(['org.1', 'op.pl.2']);
    });

    it('filtra correctamente para nivel ALTO', () => {
      const result = service.filterByLevel(controls, 'ALTO');
      expect(result).toHaveLength(3);
    });

    it('incluye controles con refuerzos (no son n.a.)', () => {
      const result = service.filterByLevel(controls, 'ALTO');
      const ids = result.map((c) => c.control_id);
      expect(ids).toContain('mp.com.3');
    });
  });

  describe('filterByText()', () => {
    const controls: ControlENS[] = [
      makeControl({
        control_id: 'org.1',
        measure_description: 'Política de Seguridad formal',
      }),
      makeControl({
        control_id: 'op.acc.1',
        measure_description: 'Control de acceso lógico',
      }),
      makeControl({
        control_id: 'mp.if.1',
        measure_description: 'Protección de instalaciones',
      }),
    ];

    it('busca por control_id (case-insensitive)', () => {
      const result = service.filterByText(controls, 'OP.ACC');
      expect(result).toHaveLength(1);
      expect(result[0].control_id).toBe('op.acc.1');
    });

    it('busca por measure_description (case-insensitive)', () => {
      const result = service.filterByText(controls, 'seguridad');
      expect(result).toHaveLength(1);
      expect(result[0].control_id).toBe('org.1');
    });

    it('retorna todos si el texto está vacío', () => {
      const result = service.filterByText(controls, '');
      expect(result).toHaveLength(3);
    });

    it('retorna todos si el texto es solo espacios', () => {
      const result = service.filterByText(controls, '   ');
      expect(result).toHaveLength(3);
    });

    it('retorna vacío si no hay coincidencias', () => {
      const result = service.filterByText(controls, 'inexistente_xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterByCategory()', () => {
    const controls: ControlENS[] = [
      makeControl({ control_id: 'org.1', category: 'org' }),
      makeControl({ control_id: 'org.2', category: 'org' }),
      makeControl({ control_id: 'op.pl.1', category: 'op.pl' }),
      makeControl({ control_id: 'mp.if.1', category: 'mp.if' }),
    ];

    it('filtra por categoría exacta', () => {
      const result = service.filterByCategory(controls, 'org');
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.category === 'org')).toBe(true);
    });

    it('retorna vacío si la categoría no existe', () => {
      const result = service.filterByCategory(controls, 'inexistente');
      expect(result).toHaveLength(0);
    });

    it('no hace match parcial', () => {
      const result = service.filterByCategory(controls, 'op');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortControls()', () => {
    const controls: ControlENS[] = [
      makeControl({ control_id: 'op.pl.1', category: 'op.pl' }),
      makeControl({ control_id: 'org.1', category: 'org' }),
      makeControl({ control_id: 'mp.if.1', category: 'mp.if' }),
    ];

    it('ordena por control_id ascendente', () => {
      const result = service.sortControls(controls, 'control_id', 'asc');
      expect(result.map((c) => c.control_id)).toEqual([
        'mp.if.1',
        'op.pl.1',
        'org.1',
      ]);
    });

    it('ordena por control_id descendente', () => {
      const result = service.sortControls(controls, 'control_id', 'desc');
      expect(result.map((c) => c.control_id)).toEqual([
        'org.1',
        'op.pl.1',
        'mp.if.1',
      ]);
    });

    it('ordena por category ascendente', () => {
      const result = service.sortControls(controls, 'category', 'asc');
      expect(result.map((c) => c.category)).toEqual([
        'mp.if',
        'op.pl',
        'org',
      ]);
    });

    it('ordena por status usa control_id como fallback', () => {
      const result = service.sortControls(controls, 'status', 'asc');
      expect(result.map((c) => c.control_id)).toEqual([
        'mp.if.1',
        'op.pl.1',
        'org.1',
      ]);
    });

    it('no muta el array original', () => {
      const original = [...controls];
      service.sortControls(controls, 'control_id', 'asc');
      expect(controls.map((c) => c.control_id)).toEqual(
        original.map((c) => c.control_id)
      );
    });
  });

  describe('getCategories()', () => {
    const controls: ControlENS[] = [
      makeControl({ category: 'org' }),
      makeControl({ category: 'op.pl' }),
      makeControl({ category: 'org' }),
      makeControl({ category: 'mp.if' }),
      makeControl({ category: 'op.pl' }),
    ];

    it('extrae categorías únicas', () => {
      const result = service.getCategories(controls);
      expect(result).toHaveLength(3);
      expect(result).toContain('org');
      expect(result).toContain('op.pl');
      expect(result).toContain('mp.if');
    });

    it('mantiene el orden de primera aparición', () => {
      const result = service.getCategories(controls);
      expect(result).toEqual(['org', 'op.pl', 'mp.if']);
    });

    it('retorna vacío para lista vacía', () => {
      const result = service.getCategories([]);
      expect(result).toEqual([]);
    });
  });

  describe('getApplicableRefuerzos()', () => {
    it('retorna vacío si applicability es "aplica"', () => {
      const control = makeControl({
        applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
        refuerzos: [
          { id: 'R1', name: 'Refuerzo 1', description: 'Desc R1' },
        ],
      });
      const result = service.getApplicableRefuerzos(control, 'BÁSICO');
      expect(result).toEqual([]);
    });

    it('retorna vacío si applicability es "n.a."', () => {
      const control = makeControl({
        applicability: { basica: 'n.a.', media: 'aplica', alta: 'aplica' },
        refuerzos: [
          { id: 'R1', name: 'Refuerzo 1', description: 'Desc R1' },
        ],
      });
      const result = service.getApplicableRefuerzos(control, 'BÁSICO');
      expect(result).toEqual([]);
    });

    it('retorna refuerzos correctos para "+ R1"', () => {
      const control = makeControl({
        applicability: { basica: 'aplica', media: '+ R1', alta: '+ R1 + R2' },
        refuerzos: [
          { id: 'R1', name: 'Refuerzo 1', description: 'Desc R1' },
          { id: 'R2', name: 'Refuerzo 2', description: 'Desc R2' },
        ],
      });
      const result = service.getApplicableRefuerzos(control, 'MEDIO');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('R1');
    });

    it('retorna múltiples refuerzos para "+ R1 + R2"', () => {
      const control = makeControl({
        applicability: { basica: 'aplica', media: '+ R1', alta: '+ R1 + R2' },
        refuerzos: [
          { id: 'R1', name: 'Refuerzo 1', description: 'Desc R1' },
          { id: 'R2', name: 'Refuerzo 2', description: 'Desc R2' },
        ],
      });
      const result = service.getApplicableRefuerzos(control, 'ALTO');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['R1', 'R2']);
    });
  });

  describe('singleton export', () => {
    it('controlsService es una instancia de ControlsService', () => {
      expect(controlsService).toBeInstanceOf(ControlsService);
    });
  });
});
