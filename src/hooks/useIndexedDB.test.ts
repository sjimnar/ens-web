import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useIndexedDB } from './useIndexedDB';
import type { EvidenceFile } from '@/types';

function createTestFile(overrides: Partial<EvidenceFile> = {}): EvidenceFile {
  const encoder = new TextEncoder();
  const data = encoder.encode('contenido de prueba');
  return {
    id: 'file-1',
    controlId: 'org.1',
    filename: 'documento.pdf',
    mimeType: 'application/pdf',
    size: data.byteLength,
    data: data.buffer as ArrayBuffer,
    addedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('useIndexedDB', () => {
  beforeEach(() => {
    // Reset IndexedDB between tests
    indexedDB = new IDBFactory();
  });

  it('inicia con loading false y sin error', () => {
    const { result } = renderHook(() => useIndexedDB());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('guarda y recupera un archivo correctamente', async () => {
    const { result } = renderHook(() => useIndexedDB());
    const file = createTestFile();

    await act(async () => {
      await result.current.saveFile(file);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    let retrieved: EvidenceFile | null = null;
    await act(async () => {
      retrieved = await result.current.getFile('file-1');
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe('file-1');
    expect(retrieved!.filename).toBe('documento.pdf');
    expect(retrieved!.controlId).toBe('org.1');
  });

  it('recupera archivos por control', async () => {
    const { result } = renderHook(() => useIndexedDB());
    const file1 = createTestFile({ id: 'f1', controlId: 'org.1' });
    const file2 = createTestFile({ id: 'f2', controlId: 'org.1' });
    const file3 = createTestFile({ id: 'f3', controlId: 'op.pl.1' });

    await act(async () => {
      await result.current.saveFile(file1);
      await result.current.saveFile(file2);
      await result.current.saveFile(file3);
    });

    let files: EvidenceFile[] = [];
    await act(async () => {
      files = await result.current.getFilesByControl('org.1');
    });

    expect(files).toHaveLength(2);
    expect(files.every((f) => f.controlId === 'org.1')).toBe(true);
  });

  it('elimina un archivo correctamente', async () => {
    const { result } = renderHook(() => useIndexedDB());
    const file = createTestFile();

    await act(async () => {
      await result.current.saveFile(file);
    });

    await act(async () => {
      await result.current.deleteFile('file-1');
    });

    let retrieved: EvidenceFile | null = null;
    await act(async () => {
      retrieved = await result.current.getFile('file-1');
    });

    expect(retrieved).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('retorna null cuando el archivo no existe', async () => {
    const { result } = renderHook(() => useIndexedDB());

    let retrieved: EvidenceFile | null = null;
    await act(async () => {
      retrieved = await result.current.getFile('inexistente');
    });

    expect(retrieved).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('retorna lista vacía cuando no hay archivos para un control', async () => {
    const { result } = renderHook(() => useIndexedDB());

    let files: EvidenceFile[] = [];
    await act(async () => {
      files = await result.current.getFilesByControl('org.99');
    });

    expect(files).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('clearError limpia el estado de error', async () => {
    const { result } = renderHook(() => useIndexedDB());

    // Simulate clearing any error state
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
