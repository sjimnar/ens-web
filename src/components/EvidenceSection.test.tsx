import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvidenceSection, isValidUrl } from './EvidenceSection';
import type { EvidenceLink, EvidenceFile } from '../types';

describe('isValidUrl', () => {
  it('returns true for valid HTTP URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('returns true for other valid URL schemes', () => {
    expect(isValidUrl('ftp://files.example.com')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });
});

describe('EvidenceSection', () => {
  const controlId = 'org.1';

  const baseProps = {
    controlId,
    evidenceLinks: [] as EvidenceLink[],
    onAddLink: vi.fn(),
    onRemoveLink: vi.fn(),
    onAddFile: vi.fn(),
    onRemoveFile: vi.fn(),
    files: [] as EvidenceFile[],
  };

  it('renders the evidence heading in Spanish', () => {
    render(<EvidenceSection {...baseProps} />);
    expect(screen.getByText('Evidencias')).toBeInTheDocument();
  });

  it('renders URL input field and add button', () => {
    render(<EvidenceSection {...baseProps} />);
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir enlace' })).toBeInTheDocument();
  });

  it('renders file attach button', () => {
    render(<EvidenceSection {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Adjuntar archivo' })).toBeInTheDocument();
  });

  it('shows error when adding an invalid URL', () => {
    render(<EvidenceSection {...baseProps} />);

    const urlInput = screen.getByLabelText('URL');
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }));

    expect(screen.getByText('La URL introducida no es válida')).toBeInTheDocument();
    expect(baseProps.onAddLink).not.toHaveBeenCalled();
  });

  it('calls onAddLink with valid URL', () => {
    const onAddLink = vi.fn();
    render(<EvidenceSection {...baseProps} onAddLink={onAddLink} />);

    const urlInput = screen.getByLabelText('URL');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/doc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }));

    expect(onAddLink).toHaveBeenCalledTimes(1);
    const addedLink = onAddLink.mock.calls[0][0];
    expect(addedLink.url).toBe('https://example.com/doc');
    expect(addedLink.controlId).toBe(controlId);
    expect(addedLink.id).toBeTruthy();
  });

  it('clears URL input after successful add', () => {
    const onAddLink = vi.fn();
    render(<EvidenceSection {...baseProps} onAddLink={onAddLink} />);

    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }));

    expect(urlInput.value).toBe('');
  });

  it('displays existing evidence links with remove button', () => {
    const links: EvidenceLink[] = [
      {
        id: 'link-1',
        controlId,
        url: 'https://example.com',
        label: 'Ejemplo',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];
    render(<EvidenceSection {...baseProps} evidenceLinks={links} />);

    expect(screen.getByText('Ejemplo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ejemplo' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(screen.getByLabelText('Eliminar enlace Ejemplo')).toBeInTheDocument();
  });

  it('calls onRemoveLink when remove button is clicked', () => {
    const onRemoveLink = vi.fn();
    const links: EvidenceLink[] = [
      {
        id: 'link-1',
        controlId,
        url: 'https://example.com',
        label: 'Doc',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];
    render(<EvidenceSection {...baseProps} evidenceLinks={links} onRemoveLink={onRemoveLink} />);

    fireEvent.click(screen.getByLabelText('Eliminar enlace Doc'));
    expect(onRemoveLink).toHaveBeenCalledWith('link-1');
  });

  it('displays existing files with filename and download/remove buttons', () => {
    const evidenceFiles: EvidenceFile[] = [
      {
        id: 'file-1',
        controlId,
        filename: 'informe.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        data: new ArrayBuffer(1024),
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];
    render(<EvidenceSection {...baseProps} files={evidenceFiles} />);

    expect(screen.getByText('informe.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Descargar informe.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar archivo informe.pdf')).toBeInTheDocument();
  });

  it('calls onRemoveFile when file remove button is clicked', () => {
    const onRemoveFile = vi.fn();
    const evidenceFiles: EvidenceFile[] = [
      {
        id: 'file-1',
        controlId,
        filename: 'informe.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        data: new ArrayBuffer(1024),
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];
    render(<EvidenceSection {...baseProps} files={evidenceFiles} onRemoveFile={onRemoveFile} />);

    fireEvent.click(screen.getByLabelText('Eliminar archivo informe.pdf'));
    expect(onRemoveFile).toHaveBeenCalledWith('file-1');
  });

  it('shows error in Spanish when file exceeds 30 MB', async () => {
    render(<EvidenceSection {...baseProps} />);

    const fileInput = screen.getByLabelText(/Archivo/);
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.bin', {
      type: 'application/octet-stream',
    });

    // Override size property for test
    Object.defineProperty(largeFile, 'size', { value: 31 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText('El archivo excede el tamaño máximo de 30 MB')).toBeInTheDocument();
    expect(baseProps.onAddFile).not.toHaveBeenCalled();
  });

  it('calls onAddFile for valid file within size limit', async () => {
    const onAddFile = vi.fn();
    render(<EvidenceSection {...baseProps} onAddFile={onAddFile} />);

    const fileInput = screen.getByLabelText(/Archivo/);
    const smallFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [smallFile] } });

    await waitFor(() => {
      expect(onAddFile).toHaveBeenCalledTimes(1);
    });

    const addedFile = onAddFile.mock.calls[0][0];
    expect(addedFile.filename).toBe('test.txt');
    expect(addedFile.mimeType).toBe('text/plain');
    expect(addedFile.controlId).toBe(controlId);
  });

  it('uses label as link text when provided', () => {
    const onAddLink = vi.fn();
    render(<EvidenceSection {...baseProps} onAddLink={onAddLink} />);

    const urlInput = screen.getByLabelText('URL');
    const labelInput = screen.getByLabelText(/Etiqueta/);

    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.change(labelInput, { target: { value: 'Mi evidencia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }));

    const addedLink = onAddLink.mock.calls[0][0];
    expect(addedLink.label).toBe('Mi evidencia');
  });

  it('clears URL error when user starts typing', () => {
    render(<EvidenceSection {...baseProps} />);

    const urlInput = screen.getByLabelText('URL');
    fireEvent.change(urlInput, { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }));

    expect(screen.getByText('La URL introducida no es válida')).toBeInTheDocument();

    fireEvent.change(urlInput, { target: { value: 'https://' } });
    expect(screen.queryByText('La URL introducida no es válida')).not.toBeInTheDocument();
  });
});
