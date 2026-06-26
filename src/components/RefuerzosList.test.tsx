import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RefuerzosList } from './RefuerzosList';
import type { ControlENS } from '../types';

const mockControlWithRefuerzos: ControlENS = {
  control_id: 'mp.com.4',
  name: 'Segregación de redes',
  category: 'mp.com',
  category_name: 'Protección de las comunicaciones',
  group: 'mp',
  dimensions: 'Categoría',
  applicability: {
    basica: 'n.a.',
    media: '+ [R1 o R2 o R3]',
    alta: '+ [R2 o R3] + R4',
  },
  requisitos_base: 'Requisitos base',
  refuerzos: [
    { id: 'R1', name: 'VLANs', description: 'Uso de VLANs para segregación' },
    { id: 'R2', name: 'Firewalls', description: 'Uso de firewalls internos' },
    { id: 'R3', name: 'SDN', description: 'Uso de redes definidas por software' },
    { id: 'R4', name: 'Microsegmentación', description: 'Microsegmentación avanzada' },
  ],
  documentation_guidance: 'Guía',
  evidence_guidance: 'Evidencias',
  observation: 'Observaciones',
  measure_description: 'Segregación de redes',
};

const mockControlNoRefuerzos: ControlENS = {
  control_id: 'org.1',
  name: 'Política de seguridad',
  category: 'org',
  category_name: 'Marco organizativo',
  group: 'org',
  dimensions: 'Categoría',
  applicability: { basica: 'aplica', media: 'aplica', alta: 'aplica' },
  requisitos_base: 'Requisitos base',
  refuerzos: [],
  documentation_guidance: 'Guía',
  evidence_guidance: 'Evidencias',
  observation: 'Observaciones',
  measure_description: 'Política de seguridad',
};

describe('RefuerzosList', () => {
  it('muestra encabezado "Refuerzos aplicables"', () => {
    render(<RefuerzosList control={mockControlNoRefuerzos} level="BÁSICO" />);
    expect(screen.getByText('Refuerzos aplicables')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay refuerzos aplicables', () => {
    render(<RefuerzosList control={mockControlNoRefuerzos} level="BÁSICO" />);
    expect(
      screen.getByText('No hay refuerzos aplicables para este nivel')
    ).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando nivel es n.a.', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="BÁSICO" />);
    expect(
      screen.getByText('No hay refuerzos aplicables para este nivel')
    ).toBeInTheDocument();
  });

  it('muestra refuerzos aplicables para nivel MEDIO', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="MEDIO" />);
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
    expect(screen.getByText('R3')).toBeInTheDocument();
    expect(screen.getByText('VLANs')).toBeInTheDocument();
    expect(screen.getByText('Firewalls')).toBeInTheDocument();
    expect(screen.getByText('SDN')).toBeInTheDocument();
  });

  it('muestra descripciones de los refuerzos', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="MEDIO" />);
    expect(screen.getByText('Uso de VLANs para segregación')).toBeInTheDocument();
    expect(screen.getByText('Uso de firewalls internos')).toBeInTheDocument();
  });

  it('indica visualmente refuerzos alternativos con badge [R1 o R2 o R3]', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="MEDIO" />);
    // All three are alternatives in MEDIO: [R1 o R2 o R3]
    const altBadges = screen.getAllByText('[R1 o R2 o R3]');
    expect(altBadges.length).toBe(3);
  });

  it('distingue refuerzos obligatorios de alternativos en nivel ALTO', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="ALTO" />);
    // R2 and R3 are alternatives [R2 o R3], R4 is obligatory
    const altBadges = screen.getAllByText('[R2 o R3]');
    expect(altBadges.length).toBe(2); // R2 and R3 each get the badge

    // R4 is obligatory - should NOT have an alternative badge
    const r4Item = screen.getByText('R4').closest('.refuerzo-item');
    expect(r4Item).not.toBeNull();
    expect(r4Item!.querySelector('.refuerzo-item__badge-alt')).toBeNull();
  });

  it('muestra R4 como obligatorio en nivel ALTO (sin badge alternativo)', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="ALTO" />);
    expect(screen.getByText('Microsegmentación')).toBeInTheDocument();
    expect(screen.getByText('Microsegmentación avanzada')).toBeInTheDocument();
  });

  it('tiene aria-label accesible en la sección', () => {
    render(<RefuerzosList control={mockControlWithRefuerzos} level="MEDIO" />);
    expect(screen.getByLabelText('Refuerzos aplicables')).toBeInTheDocument();
  });
});
