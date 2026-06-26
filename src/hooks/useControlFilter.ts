import { useState, useMemo } from 'react';
import { controlsService } from '@/services/ControlsService';
import type { ControlENS, ControlAuditState, FilterOptions } from '@/types';

/**
 * useControlFilter — Hook para gestión de filtrado y ordenación de controles ENS.
 *
 * Mantiene el estado de filtros (texto, categoría, ordenación) y devuelve
 * los controles filtrados y ordenados de forma reactiva.
 *
 * @param controls - Lista de controles ENS (ya filtrados por nivel)
 * @param auditStates - Estado de auditoría por control (opcional, para ordenar por status)
 */
export function useControlFilter(
  controls: ControlENS[],
  auditStates?: Record<string, ControlAuditState>
) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    category: null,
    sortBy: 'category',
    sortDirection: 'asc',
  });

  const setSearchText = (searchText: string) => {
    setFilters((prev) => ({ ...prev, searchText }));
  };

  const setCategory = (category: string | null) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const setSortBy = (sortBy: FilterOptions['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const setSortDirection = (sortDirection: FilterOptions['sortDirection']) => {
    setFilters((prev) => ({ ...prev, sortDirection }));
  };

  const categories = useMemo(
    () => controlsService.getCategories(controls),
    [controls]
  );

  const filteredControls = useMemo(() => {
    let result = controls;

    // Aplicar filtro de texto
    if (filters.searchText.trim()) {
      result = controlsService.filterByText(result, filters.searchText);
    }

    // Aplicar filtro de categoría
    if (filters.category) {
      result = controlsService.filterByCategory(result, filters.category);
    }

    // Aplicar ordenación
    if (filters.sortBy === 'status' && auditStates) {
      // Ordenar por estado de cumplimiento usando los datos de auditoría
      const statusOrder: Record<string, number> = {
        Pendiente: 0,
        'En progreso': 1,
        Cumplido: 2,
        'No aplica': 3,
      };
      const dir = filters.sortDirection === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => {
        const statusA = auditStates[a.control_id]?.status ?? 'Pendiente';
        const statusB = auditStates[b.control_id]?.status ?? 'Pendiente';
        const comparison = (statusOrder[statusA] ?? 0) - (statusOrder[statusB] ?? 0);
        if (comparison !== 0) return comparison * dir;
        return a.control_id.localeCompare(b.control_id) * dir;
      });
    } else {
      result = controlsService.sortControls(
        result,
        filters.sortBy,
        filters.sortDirection
      );
    }

    return result;
  }, [controls, filters, auditStates]);

  return {
    filters,
    setSearchText,
    setCategory,
    setSortBy,
    setSortDirection,
    filteredControls,
    categories,
  };
}
