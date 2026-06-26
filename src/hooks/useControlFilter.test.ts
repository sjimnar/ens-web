import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlFilter } from './useControlFilter';
import type { ControlENS, ControlAuditState } from '@/types';

function makeControl(overrides: Partial<ControlENS> = {}): ControlENS {
  return {
    control_id: 'org.1',
    name: 'Política de seguridad',
    category: 'org',
    category_name: 'Marco organizativo',
    group: 'org',
    dimensions: '',
    applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
    requisitos_base: '',
    refuerzos: [],
    documentation_guidance: '',
    evidence_guidance: '',
    observation: '',
    measure_description: 'Política de seguridad del sistema',
    ...overrides,
  };
}

const sampleControls: ControlENS[] = [
  makeControl({ control_id: 'org.1', category: 'org', measure_description: 'Política de seguridad' }),
  makeControl({ control_id: 'org.2', category: 'org', measure_description: 'Normativa de seguridad' }),
  makeControl({ control_id: 'op.pl.1', category: 'op.pl', measure_description: 'Análisis de riesgos' }),
  makeControl({ control_id: 'op.acc.1', category: 'op.acc', measure_description: 'Identificación de usuarios' }),
];

describe('useControlFilter', () => {
  it('returns all controls initially with default filters', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    expect(result.current.filteredControls).toHaveLength(4);
    expect(result.current.filters.searchText).toBe('');
    expect(result.current.filters.category).toBeNull();
    expect(result.current.filters.sortBy).toBe('category');
    expect(result.current.filters.sortDirection).toBe('asc');
  });

  it('filters by text (case-insensitive)', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setSearchText('política');
    });

    expect(result.current.filteredControls).toHaveLength(1);
    expect(result.current.filteredControls[0].control_id).toBe('org.1');
  });

  it('filters by category', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setCategory('op.pl');
    });

    expect(result.current.filteredControls).toHaveLength(1);
    expect(result.current.filteredControls[0].control_id).toBe('op.pl.1');
  });

  it('applies text and category filters together', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setSearchText('org');
      result.current.setCategory('org');
    });

    // Both org.1 and org.2 have "org" in control_id and belong to "org" category
    expect(result.current.filteredControls).toHaveLength(2);
  });

  it('sorts by control_id ascending', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setSortBy('control_id');
      result.current.setSortDirection('asc');
    });

    const ids = result.current.filteredControls.map((c) => c.control_id);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i - 1].localeCompare(ids[i])).toBeLessThanOrEqual(0);
    }
  });

  it('sorts by control_id descending', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setSortBy('control_id');
      result.current.setSortDirection('desc');
    });

    const ids = result.current.filteredControls.map((c) => c.control_id);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i - 1].localeCompare(ids[i])).toBeGreaterThanOrEqual(0);
    }
  });

  it('sorts by status using auditStates', () => {
    const auditStates: Record<string, ControlAuditState> = {
      'org.1': { controlId: 'org.1', status: 'Cumplido', comment: '', evidenceLinks: [] },
      'org.2': { controlId: 'org.2', status: 'Pendiente', comment: '', evidenceLinks: [] },
      'op.pl.1': { controlId: 'op.pl.1', status: 'En progreso', comment: '', evidenceLinks: [] },
      'op.acc.1': { controlId: 'op.acc.1', status: 'No aplica', comment: '', evidenceLinks: [] },
    };

    const { result } = renderHook(() =>
      useControlFilter(sampleControls, auditStates)
    );

    act(() => {
      result.current.setSortBy('status');
      result.current.setSortDirection('asc');
    });

    const statuses = result.current.filteredControls.map(
      (c) => auditStates[c.control_id]?.status ?? 'Pendiente'
    );
    // Order: Pendiente(0), En progreso(1), Cumplido(2), No aplica(3)
    expect(statuses).toEqual(['Pendiente', 'En progreso', 'Cumplido', 'No aplica']);
  });

  it('extracts unique categories from controls', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    expect(result.current.categories).toEqual(['org', 'op.pl', 'op.acc']);
  });

  it('resets category filter to null', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setCategory('org');
    });
    expect(result.current.filteredControls).toHaveLength(2);

    act(() => {
      result.current.setCategory(null);
    });
    expect(result.current.filteredControls).toHaveLength(4);
  });

  it('returns empty array when no controls match filters', () => {
    const { result } = renderHook(() => useControlFilter(sampleControls));

    act(() => {
      result.current.setSearchText('nonexistent');
    });

    expect(result.current.filteredControls).toHaveLength(0);
  });
});
