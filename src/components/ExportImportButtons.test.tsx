import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportImportButtons } from './ExportImportButtons';

describe('ExportImportButtons', () => {
  it('renderiza los botones Exportar e Importar', () => {
    render(<ExportImportButtons onExport={vi.fn()} onImport={vi.fn()} onNewAudit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument();
  });

  it('llama a onExport al hacer clic en Exportar', () => {
    const onExport = vi.fn();
    render(<ExportImportButtons onExport={onExport} onImport={vi.fn()} onNewAudit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
    expect(onExport).toHaveBeenCalledOnce();
  });

  it('contiene un input file oculto que acepta .json', () => {
    const { container } = render(
      <ExportImportButtons onExport={vi.fn()} onImport={vi.fn()} onNewAudit={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe('.json');
    expect(input.style.display).toBe('none');
  });

  it('muestra mensaje de error en español si la importación falla', async () => {
    const onImport = vi.fn().mockReturnValue({ success: false });
    const { container } = render(
      <ExportImportButtons onExport={vi.fn()} onImport={onImport} onNewAudit={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['invalid-content'], 'bad.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const errorEl = screen.getByRole('alert');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl.textContent).toBe('El formato del archivo importado no es válido');
    });
  });

  it('muestra mensaje de error personalizado si onImport retorna uno', async () => {
    const onImport = vi.fn().mockReturnValue({
      success: false,
      error: 'Versión no compatible',
    });
    const { container } = render(
      <ExportImportButtons onExport={vi.fn()} onImport={onImport} onNewAudit={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{}'], 'test.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Versión no compatible');
    });
  });

  it('no muestra error cuando la importación es exitosa', async () => {
    const onImport = vi.fn().mockReturnValue({ success: true });
    const { container } = render(
      <ExportImportButtons onExport={vi.fn()} onImport={onImport} onNewAudit={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"valid": true}'], 'ok.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledOnce();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('pasa el contenido del archivo a onImport', async () => {
    const fileContent = '{"version":"1.0","level":"MEDIO"}';
    const onImport = vi.fn().mockReturnValue({ success: true });
    const { container } = render(
      <ExportImportButtons onExport={vi.fn()} onImport={onImport} onNewAudit={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([fileContent], 'data.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith(fileContent);
    });
  });

  it('los botones tienen aria-label accesibles en español', () => {
    render(<ExportImportButtons onExport={vi.fn()} onImport={vi.fn()} onNewAudit={vi.fn()} />);

    const exportBtn = screen.getByRole('button', { name: 'Exportar datos de auditoría' });
    const importBtn = screen.getByRole('button', { name: 'Importar datos de auditoría' });

    expect(exportBtn).toBeInTheDocument();
    expect(importBtn).toBeInTheDocument();
  });
});
