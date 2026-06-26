import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from './StorageService';
import type { AuditState, ControlAuditState } from '@/types';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── isStorageAvailable ─────────────────────────────────────────────

  describe('isStorageAvailable', () => {
    it('devuelve true cuando localStorage está disponible', () => {
      expect(service.isStorageAvailable()).toBe(true);
    });

    it('devuelve false cuando localStorage lanza error', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Not available');
      });
      expect(service.isStorageAvailable()).toBe(false);
    });
  });

  // ─── getLevel / saveLevel ───────────────────────────────────────────

  describe('getLevel / saveLevel', () => {
    it('devuelve null cuando no hay nivel guardado', () => {
      expect(service.getLevel()).toBeNull();
    });

    it('guarda y recupera nivel BÁSICO', () => {
      service.saveLevel('BÁSICO');
      expect(service.getLevel()).toBe('BÁSICO');
    });

    it('guarda y recupera nivel MEDIO', () => {
      service.saveLevel('MEDIO');
      expect(service.getLevel()).toBe('MEDIO');
    });

    it('guarda y recupera nivel ALTO', () => {
      service.saveLevel('ALTO');
      expect(service.getLevel()).toBe('ALTO');
    });

    it('lanza error en español cuando localStorage está lleno', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });
      expect(() => service.saveLevel('ALTO')).toThrow('almacenamiento local está lleno');
    });

    it('lanza error en español cuando localStorage no está disponible', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Generic error');
      });
      expect(() => service.saveLevel('BÁSICO')).toThrow('almacenamiento local no está disponible');
    });
  });

  // ─── removeLevel ────────────────────────────────────────────────────

  describe('removeLevel', () => {
    it('después de saveLevel y removeLevel, getLevel devuelve null', () => {
      service.saveLevel('MEDIO');
      expect(service.getLevel()).toBe('MEDIO');
      service.removeLevel();
      expect(service.getLevel()).toBeNull();
    });

    it('no afecta a otras claves de almacenamiento (auditState, controlPrefix)', () => {
      const mockState: AuditState = {
        level: 'MEDIO',
        controls: {},
        lastModified: '2024-01-15T10:00:00Z',
      };
      const mockControlState: ControlAuditState = {
        controlId: 'org.1',
        status: 'Pendiente',
        comment: 'test',
        evidenceLinks: [],
      };

      service.saveLevel('MEDIO');
      service.saveAuditState(mockState);
      service.saveControlState('org.1', mockControlState);

      service.removeLevel();

      expect(service.getLevel()).toBeNull();
      expect(service.getAuditState()).toEqual(mockState);
      expect(service.getControlState('org.1')).toEqual(mockControlState);
    });

    it('no lanza error si no hay nivel guardado', () => {
      expect(() => service.removeLevel()).not.toThrow();
      expect(service.getLevel()).toBeNull();
    });
  });

  // ─── getAuditState / saveAuditState ─────────────────────────────────

  describe('getAuditState / saveAuditState', () => {
    const mockState: AuditState = {
      level: 'MEDIO',
      controls: {
        'org.1': {
          controlId: 'org.1',
          status: 'Cumplido',
          comment: 'Todo en orden',
          evidenceLinks: [],
        },
      },
      lastModified: '2024-01-15T10:00:00Z',
    };

    it('devuelve null cuando no hay estado guardado', () => {
      expect(service.getAuditState()).toBeNull();
    });

    it('guarda y recupera el estado de auditoría completo', () => {
      service.saveAuditState(mockState);
      const result = service.getAuditState();
      expect(result).toEqual(mockState);
    });

    it('lanza error en español cuando localStorage está lleno', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });
      expect(() => service.saveAuditState(mockState)).toThrow('almacenamiento local está lleno');
    });

    it('lanza error en español cuando localStorage no está disponible', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Generic error');
      });
      expect(() => service.saveAuditState(mockState)).toThrow('almacenamiento local no está disponible');
    });
  });

  // ─── getControlState / saveControlState ─────────────────────────────

  describe('getControlState / saveControlState', () => {
    const mockControlState: ControlAuditState = {
      controlId: 'op.acc.1',
      status: 'En progreso',
      comment: 'Revisando accesos',
      evidenceLinks: [
        {
          id: 'ev-1',
          controlId: 'op.acc.1',
          url: 'https://example.com/doc',
          label: 'Política de accesos',
          addedAt: '2024-01-15T10:00:00Z',
        },
      ],
    };

    it('devuelve null cuando no hay estado guardado para un control', () => {
      expect(service.getControlState('op.acc.1')).toBeNull();
    });

    it('guarda y recupera el estado de un control', () => {
      service.saveControlState('op.acc.1', mockControlState);
      const result = service.getControlState('op.acc.1');
      expect(result).toEqual(mockControlState);
    });

    it('no interfiere entre distintos controles', () => {
      service.saveControlState('op.acc.1', mockControlState);
      expect(service.getControlState('op.acc.2')).toBeNull();
    });

    it('lanza error en español cuando localStorage está lleno', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });
      expect(() => service.saveControlState('op.acc.1', mockControlState)).toThrow('almacenamiento local está lleno');
    });

    it('lanza error en español cuando localStorage no está disponible', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Generic error');
      });
      expect(() => service.saveControlState('op.acc.1', mockControlState)).toThrow('almacenamiento local no está disponible');
    });
  });

  // ─── localStorage key namespacing ───────────────────────────────────

  describe('namespace isolation', () => {
    it('usa prefijo ens-audit- en las claves de nivel', () => {
      service.saveLevel('ALTO');
      const raw = localStorage.getItem('ens-audit-level');
      expect(raw).toBe('ALTO');
    });

    it('usa prefijo ens-audit- en las claves de estado', () => {
      const state: AuditState = {
        level: 'BÁSICO',
        controls: {},
        lastModified: '2024-01-01T00:00:00Z',
      };
      service.saveAuditState(state);
      const raw = localStorage.getItem('ens-audit-state');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(state);
    });

    it('usa prefijo ens-audit-control- en las claves de control', () => {
      const controlState: ControlAuditState = {
        controlId: 'org.1',
        status: 'Pendiente',
        comment: '',
        evidenceLinks: [],
      };
      service.saveControlState('org.1', controlState);
      const raw = localStorage.getItem('ens-audit-control-org.1');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(controlState);
    });

    it('no colisiona con datos de otras aplicaciones', () => {
      localStorage.setItem('other-app-key', 'value');
      service.saveLevel('MEDIO');
      expect(localStorage.getItem('other-app-key')).toBe('value');
      expect(service.getLevel()).toBe('MEDIO');
    });
  });
});
