import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommentField } from './CommentField';

describe('CommentField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a textarea with the default placeholder in Spanish', () => {
    render(<CommentField value="" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute(
      'placeholder',
      'Añadir comentarios u observaciones...'
    );
  });

  it('renders a custom placeholder when provided', () => {
    render(
      <CommentField value="" onChange={vi.fn()} placeholder="Notas..." />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Notas...');
  });

  it('displays the controlled value', () => {
    render(<CommentField value="Mi comentario" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Mi comentario');
  });

  it('has an accessible label in Spanish', () => {
    render(<CommentField value="" onChange={vi.fn()} />);

    const label = screen.getByText('Comentarios / Observaciones');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('displays character count', () => {
    render(<CommentField value="Hola" onChange={vi.fn()} />);

    expect(screen.getByText('4 caracteres')).toBeInTheDocument();
  });

  it('updates character count as user types', () => {
    render(<CommentField value="" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test' } });

    expect(screen.getByText('4 caracteres')).toBeInTheDocument();
  });

  it('calls onChange after debounce delay', () => {
    const onChange = vi.fn();
    render(<CommentField value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Nuevo texto' } });

    // Should not call immediately
    expect(onChange).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Nuevo texto');
  });

  it('calls onChange immediately on blur', () => {
    const onChange = vi.fn();
    render(<CommentField value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Guardado al salir' } });
    fireEvent.blur(textarea);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Guardado al salir');
  });

  it('does not double-fire onChange on blur after debounce', () => {
    const onChange = vi.fn();
    render(<CommentField value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Texto' } });

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onChange).toHaveBeenCalledTimes(1);

    // Blur after debounce — should not fire again (same value)
    fireEvent.blur(textarea);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('allows clearing the comment', () => {
    const onChange = vi.fn();
    render(<CommentField value="Texto existente" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.blur(textarea);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('syncs local state when controlled value changes from parent', () => {
    const { rerender } = render(
      <CommentField value="Inicial" onChange={vi.fn()} />
    );

    rerender(<CommentField value="Actualizado" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Actualizado');
  });
});
