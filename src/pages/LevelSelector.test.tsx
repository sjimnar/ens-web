import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LevelSelector } from './LevelSelector';
import type { NivelENS } from '../types';

describe('LevelSelector', () => {
  it('muestra las tres opciones de nivel ENS', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    expect(screen.getByText('BÁSICO')).toBeInTheDocument();
    expect(screen.getByText('MEDIO')).toBeInTheDocument();
    expect(screen.getByText('ALTO')).toBeInTheDocument();
  });

  it('muestra el título "Auditoría ENS"', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    expect(screen.getByText('Auditoría ENS')).toBeInTheDocument();
  });

  it('muestra la cantidad de controles por nivel', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    expect(screen.getByText('52 controles')).toBeInTheDocument();
    expect(screen.getByText('68 controles')).toBeInTheDocument();
    expect(screen.getByText('73 controles')).toBeInTheDocument();
  });

  it('llama a onSelectLevel con "BÁSICO" al hacer clic en la tarjeta BÁSICO', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    fireEvent.click(screen.getByLabelText('Seleccionar nivel BÁSICO'));
    expect(onSelectLevel).toHaveBeenCalledWith('BÁSICO');
  });

  it('llama a onSelectLevel con "MEDIO" al hacer clic en la tarjeta MEDIO', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    fireEvent.click(screen.getByLabelText('Seleccionar nivel MEDIO'));
    expect(onSelectLevel).toHaveBeenCalledWith('MEDIO');
  });

  it('llama a onSelectLevel con "ALTO" al hacer clic en la tarjeta ALTO', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    fireEvent.click(screen.getByLabelText('Seleccionar nivel ALTO'));
    expect(onSelectLevel).toHaveBeenCalledWith('ALTO');
  });

  it('todos los textos están en español', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    expect(screen.getByText(/Esquema Nacional de Seguridad/)).toBeInTheDocument();
    expect(screen.getByText(/Selecciona el nivel de seguridad/)).toBeInTheDocument();
  });

  it('cada tarjeta es un botón accesible', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('llama a onSelectLevel exactamente una vez por clic', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    fireEvent.click(screen.getByLabelText('Seleccionar nivel ALTO'));
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
  });

  it('pasa el tipo NivelENS correcto para cada nivel', () => {
    const levels: NivelENS[] = ['BÁSICO', 'MEDIO', 'ALTO'];
    const onSelectLevel = vi.fn();
    render(<LevelSelector onSelectLevel={onSelectLevel} />);

    for (const level of levels) {
      fireEvent.click(screen.getByLabelText(`Seleccionar nivel ${level}`));
    }

    expect(onSelectLevel).toHaveBeenNthCalledWith(1, 'BÁSICO');
    expect(onSelectLevel).toHaveBeenNthCalledWith(2, 'MEDIO');
    expect(onSelectLevel).toHaveBeenNthCalledWith(3, 'ALTO');
  });
});
