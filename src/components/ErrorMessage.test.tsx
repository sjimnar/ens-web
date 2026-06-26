import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  describe('variant inline (default)', () => {
    it('renderiza el mensaje con role="alert"', () => {
      render(<ErrorMessage message="Campo obligatorio" />);
      const el = screen.getByRole('alert');
      expect(el).toHaveTextContent('Campo obligatorio');
    });

    it('usa inline como variante por defecto', () => {
      render(<ErrorMessage message="Error de validación" />);
      const el = screen.getByRole('alert');
      expect(el.tagName).toBe('P');
    });
  });

  describe('variant toast', () => {
    it('renderiza el mensaje con role="alert"', () => {
      render(<ErrorMessage message="No se pudo guardar" variant="toast" />);
      const el = screen.getByRole('alert');
      expect(el).toHaveTextContent('No se pudo guardar');
    });

    it('muestra botón de cerrar si onDismiss está definido', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Error temporal" variant="toast" onDismiss={onDismiss} />);
      const btn = screen.getByRole('button', { name: /cerrar/i });
      expect(btn).toBeInTheDocument();
    });

    it('llama a onDismiss al hacer clic en cerrar', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Error temporal" variant="toast" onDismiss={onDismiss} />);
      const btn = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(btn);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('no muestra botón de cerrar si onDismiss no está definido', () => {
      render(<ErrorMessage message="Error sin cerrar" variant="toast" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('variant critical', () => {
    it('renderiza con role="alertdialog"', () => {
      render(<ErrorMessage message="El almacenamiento no está disponible" variant="critical" />);
      const el = screen.getByRole('alertdialog');
      expect(el).toBeInTheDocument();
    });

    it('muestra el título "Error crítico"', () => {
      render(<ErrorMessage message="Fallo grave" variant="critical" />);
      expect(screen.getByText('Error crítico')).toBeInTheDocument();
    });

    it('muestra el mensaje de error', () => {
      render(<ErrorMessage message="No se pueden cargar los datos" variant="critical" />);
      expect(screen.getByText('No se pueden cargar los datos')).toBeInTheDocument();
    });

    it('muestra botón "Entendido" si onDismiss está definido', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Error grave" variant="critical" onDismiss={onDismiss} />);
      const btn = screen.getByRole('button', { name: 'Entendido' });
      expect(btn).toBeInTheDocument();
    });

    it('llama a onDismiss al hacer clic en "Entendido"', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Error grave" variant="critical" onDismiss={onDismiss} />);
      fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('no muestra botón si onDismiss no está definido', () => {
      render(<ErrorMessage message="Bloqueado" variant="critical" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('textos en español', () => {
    it('el aria-label del botón cerrar está en español', () => {
      render(<ErrorMessage message="Error" variant="toast" onDismiss={() => {}} />);
      expect(screen.getByLabelText('Cerrar mensaje de error')).toBeInTheDocument();
    });

    it('el aria-label del dialog crítico está en español', () => {
      render(<ErrorMessage message="Error" variant="critical" />);
      const el = screen.getByRole('alertdialog');
      expect(el).toHaveAttribute('aria-label', 'Error crítico');
    });
  });
});
