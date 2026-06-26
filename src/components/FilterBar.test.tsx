import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

function renderFilterBar(overrides = {}) {
  const defaultProps = {
    searchText: '',
    onSearchChange: vi.fn(),
    category: null,
    onCategoryChange: vi.fn(),
    categories: ['org', 'op.pl', 'op.acc', 'mp.if'],
    sortBy: 'category' as const,
    onSortChange: vi.fn(),
    resultsCount: 10,
  };
  const props = { ...defaultProps, ...overrides };
  return { ...render(<FilterBar {...props} />), props };
}

describe('FilterBar', () => {
  it('renders category dropdown with "Todas las categorías" as default', () => {
    renderFilterBar();
    const select = screen.getByLabelText('Filtrar por categoría');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Todas las categorías')).toBeInTheDocument();
  });

  it('renders all provided categories as options', () => {
    renderFilterBar({ categories: ['org', 'op.pl', 'mp.if'] });
    expect(screen.getByText('org')).toBeInTheDocument();
    expect(screen.getByText('op.pl')).toBeInTheDocument();
    expect(screen.getByText('mp.if')).toBeInTheDocument();
  });

  it('renders sort dropdown with three options in Spanish', () => {
    renderFilterBar();
    const sortSelect = screen.getByLabelText('Ordenar controles');
    const options = sortSelect.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Categoría');
    expect(options[1]).toHaveTextContent('ID Control');
    expect(options[2]).toHaveTextContent('Estado');
  });

  it('calls onCategoryChange with category value when selecting a category', () => {
    const { props } = renderFilterBar();
    const select = screen.getByLabelText('Filtrar por categoría');
    fireEvent.change(select, { target: { value: 'op.pl' } });
    expect(props.onCategoryChange).toHaveBeenCalledWith('op.pl');
  });

  it('calls onCategoryChange with null when selecting "Todas las categorías"', () => {
    const { props } = renderFilterBar({ category: 'org' });
    const select = screen.getByLabelText('Filtrar por categoría');
    fireEvent.change(select, { target: { value: '' } });
    expect(props.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it('calls onSortChange when selecting a sort option', () => {
    const { props } = renderFilterBar();
    const select = screen.getByLabelText('Ordenar controles');
    fireEvent.change(select, { target: { value: 'control_id' } });
    expect(props.onSortChange).toHaveBeenCalledWith('control_id');
  });

  it('shows "No se encontraron controles" when resultsCount is 0', () => {
    renderFilterBar({ resultsCount: 0 });
    expect(screen.getByText('No se encontraron controles')).toBeInTheDocument();
  });

  it('does not show "No se encontraron controles" when resultsCount > 0', () => {
    renderFilterBar({ resultsCount: 5 });
    expect(screen.queryByText('No se encontraron controles')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderFilterBar();
    const searchRegion = screen.getByRole('search');
    expect(searchRegion).toHaveAttribute('aria-label', 'Filtros de controles');
  });

  it('displays current sort selection', () => {
    renderFilterBar({ sortBy: 'status' });
    const select = screen.getByLabelText('Ordenar controles') as HTMLSelectElement;
    expect(select.value).toBe('status');
  });
});
