import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlCard } from './ControlCard';
import type { ControlENS, ComplianceStatus } from '../types';

const mockControl: ControlENS = {
  control_id: 'org.1',
  name: 'Política de seguridad',
  category: 'org',
  category_name: 'Marco organizativo',
  group: 'org',
  dimensions: 'Categoría',
  applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
  requisitos_base: 'Requisitos base del control',
  refuerzos: [],
  documentation_guidance: 'Guía de documentación',
  evidence_guidance: 'Guía de evidencias',
  observation: 'Observaciones',
  measure_description: 'Se dispondrá de una política de seguridad que articule la gestión continuada de la seguridad.',
};

describe('ControlCard', () => {
  it('muestra el control_id de forma prominente', () => {
    render(<ControlCard control={mockControl} status="Pendiente" onClick={() => {}} />);
    expect(screen.getByText('org.1')).toBeInTheDocument();
  });

  it('muestra el nombre del control', () => {
    render(<ControlCard control={mockControl} status="Pendiente" onClick={() => {}} />);
    expect(screen.getByText('Política de seguridad')).toBeInTheDocument();
  });

  it('muestra la measure_description', () => {
    render(<ControlCard control={mockControl} status="Pendiente" onClick={() => {}} />);
    expect(screen.getByText(/Se dispondrá de una política de seguridad/)).toBeInTheDocument();
  });

  it('trunca measure_description larga con puntos suspensivos', () => {
    const longControl: ControlENS = {
      ...mockControl,
      measure_description: 'A'.repeat(200),
    };
    render(<ControlCard control={longControl} status="Pendiente" onClick={() => {}} />);
    const description = screen.getByText(/A+…$/);
    expect(description.textContent!.length).toBeLessThanOrEqual(121); // 120 chars + '…'
  });

  it.each([
    ['Pendiente', '#9ca3af'],
    ['En progreso', '#d97706'],
    ['Cumplido', '#16a34a'],
    ['No aplica', '#d1d5db'],
  ] as [ComplianceStatus, string][])(
    'muestra badge con color correcto para estado "%s"',
    (status, expectedColor) => {
      render(<ControlCard control={mockControl} status={status} onClick={() => {}} />);
      const badge = screen.getByText(status);
      expect(badge).toHaveStyle({ backgroundColor: expectedColor });
    }
  );

  it('invoca onClick al hacer click en la tarjeta', () => {
    const handleClick = vi.fn();
    render(<ControlCard control={mockControl} status="Cumplido" onClick={handleClick} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('invoca onClick al presionar Enter', () => {
    const handleClick = vi.fn();
    render(<ControlCard control={mockControl} status="Cumplido" onClick={handleClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('invoca onClick al presionar Space', () => {
    const handleClick = vi.fn();
    render(<ControlCard control={mockControl} status="Cumplido" onClick={handleClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('tiene aria-label descriptivo con control_id y name', () => {
    render(<ControlCard control={mockControl} status="Pendiente" onClick={() => {}} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Control org.1: Política de seguridad');
  });
});
