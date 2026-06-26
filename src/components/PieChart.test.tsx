import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PieChart } from './PieChart';
import type { ProgressDistribution } from '../types';

// Mock canvas context for chart.js in jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    canvas: { width: 300, height: 300 },
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    getImageData: vi.fn().mockReturnValue({ data: [] }),
    putImageData: vi.fn(),
    createPattern: vi.fn(),
    clip: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    isPointInPath: vi.fn(),
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    strokeStyle: '#000',
    fillStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    globalAlpha: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('PieChart', () => {
  const sampleDistribution: ProgressDistribution = {
    pendiente: 10,
    enProgreso: 5,
    cumplido: 3,
    noAplica: 2,
    total: 20,
  };

  it('renders the chart title in Spanish', () => {
    render(<PieChart distribution={sampleDistribution} />);
    expect(screen.getByText('Progreso de la auditoría')).toBeInTheDocument();
  });

  it('displays the total number of controls', () => {
    render(<PieChart distribution={sampleDistribution} />);
    expect(screen.getByText('Total de controles: 20')).toBeInTheDocument();
  });

  it('renders a canvas element for the chart', () => {
    const { container } = render(<PieChart distribution={sampleDistribution} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('shows empty message when total is 0', () => {
    const emptyDistribution: ProgressDistribution = {
      pendiente: 0,
      enProgreso: 0,
      cumplido: 0,
      noAplica: 0,
      total: 0,
    };
    render(<PieChart distribution={emptyDistribution} />);
    expect(screen.getByText('No hay controles aplicables para mostrar.')).toBeInTheDocument();
  });

  it('does not render canvas when total is 0', () => {
    const emptyDistribution: ProgressDistribution = {
      pendiente: 0,
      enProgreso: 0,
      cumplido: 0,
      noAplica: 0,
      total: 0,
    };
    const { container } = render(<PieChart distribution={emptyDistribution} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeInTheDocument();
  });

  it('updates displayed total when distribution prop changes', () => {
    const { unmount } = render(<PieChart distribution={sampleDistribution} />);
    expect(screen.getByText('Total de controles: 20')).toBeInTheDocument();
    unmount();

    const updated: ProgressDistribution = {
      pendiente: 5,
      enProgreso: 10,
      cumplido: 8,
      noAplica: 2,
      total: 25,
    };
    render(<PieChart distribution={updated} />);
    expect(screen.getByText('Total de controles: 25')).toBeInTheDocument();
  });

  it('has the pie-chart-container class', () => {
    const { container } = render(<PieChart distribution={sampleDistribution} />);
    expect(container.querySelector('.pie-chart-container')).toBeInTheDocument();
  });
});
