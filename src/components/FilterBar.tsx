import type { ChangeEvent } from 'react';

export interface FilterBarProps {
  searchText?: string;
  onSearchChange?: (text: string) => void;
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  sortBy: 'category' | 'control_id' | 'status';
  onSortChange: (sort: 'category' | 'control_id' | 'status') => void;
  resultsCount: number;
}

export function FilterBar({
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  resultsCount,
}: FilterBarProps) {

  function handleCategoryChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onCategoryChange(value === '' ? null : value);
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    onSortChange(e.target.value as 'category' | 'control_id' | 'status');
  }

  return (
    <div className="filter-bar" role="search" aria-label="Filtros de controles">
      <div className="filter-bar__controls">
        <div className="filter-bar__field">
          <label htmlFor="filter-category" className="filter-bar__label">
            Categoría
          </label>
          <select
            id="filter-category"
            className="filter-bar__select"
            value={category ?? ''}
            onChange={handleCategoryChange}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-bar__field">
          <label htmlFor="filter-sort" className="filter-bar__label">
            Ordenar por
          </label>
          <select
            id="filter-sort"
            className="filter-bar__select"
            value={sortBy}
            onChange={handleSortChange}
            aria-label="Ordenar controles"
          >
            <option value="category">Categoría</option>
            <option value="control_id">ID Control</option>
            <option value="status">Estado</option>
          </select>
        </div>
      </div>

      {resultsCount === 0 && (
        <p className="filter-bar__no-results" role="status" aria-live="polite">
          No se encontraron controles
        </p>
      )}
    </div>
  );
}
