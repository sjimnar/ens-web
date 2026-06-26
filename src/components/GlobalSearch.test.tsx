import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock controlsService
vi.mock('@/services/ControlsService', () => ({
  controlsService: {
    loadControls: () => [
      {
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
        measure_description: 'Política de seguridad de la organización',
      },
      {
        control_id: 'op.pl.1',
        name: 'Análisis de riesgos',
        category: 'op.pl',
        category_name: 'Planificación',
        group: 'op',
        dimensions: '',
        applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
        requisitos_base: '',
        refuerzos: [],
        documentation_guidance: '',
        evidence_guidance: '',
        observation: '',
        measure_description: 'Análisis de riesgos del sistema',
      },
      {
        control_id: 'mp.sw.1',
        name: 'Desarrollo de aplicaciones',
        category: 'mp.sw',
        category_name: 'Protección de aplicaciones',
        group: 'mp',
        dimensions: '',
        applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
        requisitos_base: '',
        refuerzos: [],
        documentation_guidance: '',
        evidence_guidance: '',
        observation: '',
        measure_description: 'Desarrollo seguro de aplicaciones',
      },
    ],
  },
}));

function renderGlobalSearch() {
  return render(
    <MemoryRouter>
      <GlobalSearch />
    </MemoryRouter>
  );
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a searchbox input with placeholder', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Buscar control...');
  });

  it('can be found by placeholder text', () => {
    renderGlobalSearch();
    const input = screen.getByPlaceholderText(/buscar/i);
    expect(input).toBeInTheDocument();
  });

  it('does not show dropdown when input is empty', () => {
    renderGlobalSearch();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows dropdown with results after typing and debounce', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    // Before debounce, dropdown may be open but no results yet
    act(() => {
      vi.advanceTimersByTime(150);
    });

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByText('org.1')).toBeInTheDocument();
    expect(screen.getByText('Política de seguridad')).toBeInTheDocument();
  });

  it('filters by control_id (case-insensitive)', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'OP.PL' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('op.pl.1')).toBeInTheDocument();
    expect(screen.getByText('Análisis de riesgos')).toBeInTheDocument();
    expect(screen.queryByText('org.1')).not.toBeInTheDocument();
  });

  it('filters by name (case-insensitive)', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'desarrollo' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('mp.sw.1')).toBeInTheDocument();
    expect(screen.getByText('Desarrollo de aplicaciones')).toBeInTheDocument();
  });

  it('shows "Sin resultados" when no match found', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'zzzzz' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('navigates to control on item click', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    const item = screen.getByText('org.1');
    fireEvent.mouseDown(item.closest('[role="option"]')!);

    expect(mockNavigate).toHaveBeenCalledWith('/controls/org.1');
  });

  it('navigates with keyboard: arrow down + Enter', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/controls/org.1');
  });

  it('closes dropdown on Escape key', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('highlights active item with ArrowDown/ArrowUp', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'a' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // ArrowDown selects first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // ArrowDown again selects second
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    // ArrowUp goes back to first
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('clears input after selection', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue('');
  });

  it('has aria-expanded=false when dropdown is closed', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('has aria-expanded=true when dropdown is open', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('debounces filtering by 150ms', () => {
    renderGlobalSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'org' } });

    // Before debounce expires - dropdown open but no results yet (query hasn't debounced)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // The debouncedQuery has not updated, so results should be empty
    expect(screen.queryByText('org.1')).not.toBeInTheDocument();

    // After debounce
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText('org.1')).toBeInTheDocument();
  });
});
