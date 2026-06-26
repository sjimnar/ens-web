import { describe, it, expect } from 'vitest';
import {
  extractControlCode,
  loadMedidas,
  getMedidasForControl,
  MedidasService,
  medidasService,
} from './MedidasService';

describe('MedidasService', () => {
  describe('extractControlCode', () => {
    it('devuelve el código tal cual si no hay espacios', () => {
      expect(extractControlCode('op.acc.1')).toBe('op.acc.1');
    });

    it('extrae el código antes de los espacios', () => {
      expect(extractControlCode('op.acc.1  Control de identificadores')).toBe(
        'op.acc.1'
      );
    });

    it('maneja múltiples espacios', () => {
      expect(extractControlCode('mp.if.3    Protección frente a incendios')).toBe(
        'mp.if.3'
      );
    });

    it('maneja tabs como separador', () => {
      expect(extractControlCode('org.1\tMarco organizativo')).toBe('org.1');
    });

    it('devuelve string vacío para input vacío', () => {
      expect(extractControlCode('')).toBe('');
    });

    it('maneja espacios al inicio y final', () => {
      expect(extractControlCode('  op.acc.1  ')).toBe('op.acc.1');
    });
  });

  describe('loadMedidas', () => {
    it('carga un array no vacío de medidas técnicas', () => {
      const medidas = loadMedidas();
      expect(Array.isArray(medidas)).toBe(true);
      expect(medidas.length).toBeGreaterThan(0);
    });

    it('cada medida tiene los campos requeridos', () => {
      const medidas = loadMedidas();
      const primera = medidas[0];
      expect(primera).toHaveProperty('id');
      expect(primera).toHaveProperty('element');
      expect(primera).toHaveProperty('controls_ens');
      expect(primera).toHaveProperty('technical_measure');
      expect(primera).toHaveProperty('responsible');
      expect(primera).toHaveProperty('evidence_type');
      expect(primera).toHaveProperty('status');
    });
  });

  describe('getMedidasForControl', () => {
    it('devuelve medidas vinculadas a op.acc.1', () => {
      const result = getMedidasForControl('op.acc.1');
      expect(result.length).toBeGreaterThan(0);
      // Todas las medidas devueltas deben contener op.acc.1 en controls_ens
      result.forEach((m) => {
        const controls = m.controls_ens
          .split(';')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        expect(controls).toContain('op.acc.1');
      });
    });

    it('devuelve array vacío para un control inexistente', () => {
      const result = getMedidasForControl('xyz.999');
      expect(result).toEqual([]);
    });

    it('devuelve array vacío para un controlId vacío', () => {
      const result = getMedidasForControl('');
      expect(result).toEqual([]);
    });

    it('funciona con control_id que incluye descripción', () => {
      const result = getMedidasForControl('op.acc.1  Control de identificadores');
      expect(result.length).toBeGreaterThan(0);
    });

    it('acepta un array de medidas como parámetro', () => {
      const medidas = [
        {
          id: '1',
          element: 'Test',
          controls_ens: 'op.acc.1; op.acc.2;',
          technical_measure: 'Medida test',
          strategic_observation: '',
          technical_observation: '',
          responsible: 'Test',
          evidence_type: 'Documento',
          status: 'Implementado',
          ticket: '',
          control_status: '',
          last_review: '',
        },
        {
          id: '2',
          element: 'Test2',
          controls_ens: 'mp.if.1;',
          technical_measure: 'Otra medida',
          strategic_observation: '',
          technical_observation: '',
          responsible: 'Test',
          evidence_type: 'Documento',
          status: 'Pendiente',
          ticket: '',
          control_status: '',
          last_review: '',
        },
      ];
      const result = getMedidasForControl('op.acc.1', medidas);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('no incluye medidas donde el código es substring parcial', () => {
      const medidas = [
        {
          id: '1',
          element: 'Test',
          controls_ens: 'op.acc.10; op.acc.11;',
          technical_measure: 'Medida test',
          strategic_observation: '',
          technical_observation: '',
          responsible: 'Test',
          evidence_type: 'Documento',
          status: 'Implementado',
          ticket: '',
          control_status: '',
          last_review: '',
        },
      ];
      // op.acc.1 should NOT match op.acc.10 or op.acc.11
      const result = getMedidasForControl('op.acc.1', medidas);
      expect(result).toHaveLength(0);
    });
  });

  describe('MedidasService class', () => {
    it('exporta una instancia singleton', () => {
      expect(medidasService).toBeInstanceOf(MedidasService);
    });

    it('loadMedidas devuelve medidas cacheadas', () => {
      const service = new MedidasService();
      const first = service.loadMedidas();
      const second = service.loadMedidas();
      expect(first).toBe(second); // misma referencia por caché
    });

    it('getMedidasForControl funciona correctamente', () => {
      const service = new MedidasService();
      const result = service.getMedidasForControl('op.acc.1');
      expect(result.length).toBeGreaterThan(0);
    });

    it('extractControlCode funciona correctamente', () => {
      const service = new MedidasService();
      expect(service.extractControlCode('op.acc.1  Desc')).toBe('op.acc.1');
    });
  });
});
