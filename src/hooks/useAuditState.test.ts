import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuditState } from './useAuditState';
import { storageService } from '@/services/StorageService';
import type { AuditState, EvidenceLink } from '@/types';

describe('useAuditState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default level MEDIO when no saved state exists', () => {
    const { result } = renderHook(() => useAuditState());
    expect(result.current.level).toBe('MEDIO');
    expect(result.current.controlStates).toEqual({});
  });

  it('should restore saved state from StorageService on mount', () => {
    const savedState: AuditState = {
      level: 'ALTO',
      controls: {
        'org.1': {
          controlId: 'org.1',
          status: 'Cumplido',
          comment: 'Comentario test',
          evidenceLinks: [],
        },
      },
      lastModified: '2024-01-01T00:00:00.000Z',
    };
    storageService.saveAuditState(savedState);

    const { result } = renderHook(() => useAuditState());
    expect(result.current.level).toBe('ALTO');
    expect(result.current.controlStates['org.1'].status).toBe('Cumplido');
    expect(result.current.controlStates['org.1'].comment).toBe('Comentario test');
  });

  it('should change level while preserving all existing control states', () => {
    const { result } = renderHook(() => useAuditState());

    // Set some control states
    act(() => {
      result.current.setControlStatus('org.1', 'Cumplido');
      result.current.setComment('org.1', 'Mi comentario');
    });

    // Change level
    act(() => {
      result.current.setLevel('ALTO');
    });

    // Level changed but data preserved
    expect(result.current.level).toBe('ALTO');
    expect(result.current.controlStates['org.1'].status).toBe('Cumplido');
    expect(result.current.controlStates['org.1'].comment).toBe('Mi comentario');
  });

  it('should set compliance status for a control', () => {
    const { result } = renderHook(() => useAuditState());

    act(() => {
      result.current.setControlStatus('op.pl.1', 'En progreso');
    });

    expect(result.current.controlStates['op.pl.1'].status).toBe('En progreso');
    expect(result.current.controlStates['op.pl.1'].comment).toBe('');
    expect(result.current.controlStates['op.pl.1'].evidenceLinks).toEqual([]);
  });

  it('should set comment for a control', () => {
    const { result } = renderHook(() => useAuditState());

    act(() => {
      result.current.setComment('op.acc.1', 'Necesita revisión');
    });

    expect(result.current.controlStates['op.acc.1'].comment).toBe('Necesita revisión');
    expect(result.current.controlStates['op.acc.1'].status).toBe('Pendiente');
  });

  it('should add evidence link to a control', () => {
    const { result } = renderHook(() => useAuditState());

    const link: EvidenceLink = {
      id: 'link-1',
      controlId: 'org.2',
      url: 'https://example.com/evidence',
      label: 'Evidencia test',
      addedAt: '2024-06-01T10:00:00.000Z',
    };

    act(() => {
      result.current.addEvidenceLink('org.2', link);
    });

    expect(result.current.controlStates['org.2'].evidenceLinks).toHaveLength(1);
    expect(result.current.controlStates['org.2'].evidenceLinks[0]).toEqual(link);
  });

  it('should remove evidence link from a control', () => {
    const { result } = renderHook(() => useAuditState());

    const link1: EvidenceLink = {
      id: 'link-1',
      controlId: 'org.2',
      url: 'https://example.com/ev1',
      label: 'Primera',
      addedAt: '2024-06-01T10:00:00.000Z',
    };
    const link2: EvidenceLink = {
      id: 'link-2',
      controlId: 'org.2',
      url: 'https://example.com/ev2',
      label: 'Segunda',
      addedAt: '2024-06-01T11:00:00.000Z',
    };

    act(() => {
      result.current.addEvidenceLink('org.2', link1);
      result.current.addEvidenceLink('org.2', link2);
    });

    act(() => {
      result.current.removeEvidenceLink('org.2', 'link-1');
    });

    expect(result.current.controlStates['org.2'].evidenceLinks).toHaveLength(1);
    expect(result.current.controlStates['org.2'].evidenceLinks[0].id).toBe('link-2');
  });

  it('should persist state to StorageService on every change', () => {
    const { result } = renderHook(() => useAuditState());

    act(() => {
      result.current.setControlStatus('org.1', 'Cumplido');
    });

    // Verify persistence
    const saved = storageService.getAuditState();
    expect(saved).not.toBeNull();
    expect(saved!.controls['org.1'].status).toBe('Cumplido');
  });

  it('should default to Pendiente for controls without saved state', () => {
    const { result } = renderHook(() => useAuditState());

    // Setting a comment on a new control should create it with default 'Pendiente' status
    act(() => {
      result.current.setComment('mp.if.1', 'Nota');
    });

    expect(result.current.controlStates['mp.if.1'].status).toBe('Pendiente');
  });

  it('should update lastModified on every mutation', () => {
    const { result } = renderHook(() => useAuditState());

    act(() => {
      result.current.setControlStatus('org.1', 'Cumplido');
    });

    const saved = storageService.getAuditState();
    expect(saved!.lastModified).toBeDefined();
    const date = new Date(saved!.lastModified);
    expect(date.getTime()).toBeGreaterThan(0);
  });
});
