import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComplianceStatusSelector } from './ComplianceStatusSelector';
import type { ComplianceStatus } from '../types';

describe('ComplianceStatusSelector', () => {
  const defaultProps = {
    value: 'Pendiente' as ComplianceStatus,
    onChange: vi.fn(),
  };

  it('renders a select with all four compliance status options', () => {
    render(<ComplianceStatusSelector {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Pendiente');
    expect(options[1]).toHaveTextContent('En progreso');
    expect(options[2]).toHaveTextContent('Cumplido');
    expect(options[3]).toHaveTextContent('No aplica');
  });

  it('displays the current value', () => {
    render(
      <ComplianceStatusSelector {...defaultProps} value="Cumplido" />,
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Cumplido');
  });

  it('calls onChange with the new status when selection changes', () => {
    const onChange = vi.fn();
    render(
      <ComplianceStatusSelector {...defaultProps} onChange={onChange} />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'En progreso' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('En progreso');
  });

  it('has an accessible label in Spanish', () => {
    render(<ComplianceStatusSelector {...defaultProps} />);

    const label = screen.getByText('Estado de cumplimiento');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('renders a color indicator dot', () => {
    const { container } = render(
      <ComplianceStatusSelector {...defaultProps} value="Cumplido" />,
    );

    const dot = container.querySelector('.compliance-status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveStyle({ backgroundColor: '#16a34a' });
  });

  it('defaults to Pendiente with a gray dot', () => {
    const { container } = render(
      <ComplianceStatusSelector {...defaultProps} value="Pendiente" />,
    );

    const dot = container.querySelector('.compliance-status-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#9ca3af' });
  });

  it('uses controlId for unique select id', () => {
    render(
      <ComplianceStatusSelector {...defaultProps} controlId="org.1" />,
    );

    const select = screen.getByRole('combobox');
    expect(select.id).toBe('compliance-status-org.1');
  });
});
