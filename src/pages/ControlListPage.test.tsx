import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock PieChart to avoid chart.js canvas issues in jsdom
vi.mock('@/components/PieChart', () => ({
  PieChart: () => <div data-testid="pie-chart-mock">PieChart</div>,
}));

import { ControlListPage } from './ControlListPage';

describe('ControlListPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should not render a "Cambiar nivel" button (moved to AppLayout)', () => {
    localStorage.setItem('ens-audit-level', 'MEDIO');

    render(
      <MemoryRouter initialEntries={['/controls']}>
        <ControlListPage />
      </MemoryRouter>
    );

    // The "Cambiar nivel" button should no longer exist in ControlListPage
    const changeBtn = screen.queryByRole('button', { name: /cambiar nivel/i });
    expect(changeBtn).toBeNull();
  });

  it('should render PieChart and ExportImportButtons', () => {
    localStorage.setItem('ens-audit-level', 'MEDIO');

    render(
      <MemoryRouter initialEntries={['/controls']}>
        <ControlListPage />
      </MemoryRouter>
    );

    // PieChart mock should be present
    expect(screen.getByTestId('pie-chart-mock')).toBeTruthy();

    // Export button should be present
    expect(screen.getByRole('button', { name: /exportar/i })).toBeTruthy();
  });

  it('should render control cards grouped by category', () => {
    localStorage.setItem('ens-audit-level', 'MEDIO');

    render(
      <MemoryRouter initialEntries={['/controls']}>
        <ControlListPage />
      </MemoryRouter>
    );

    // Should have category headings
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.length).toBeGreaterThan(0);
  });
});
