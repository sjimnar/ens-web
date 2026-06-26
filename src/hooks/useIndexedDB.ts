import { useCallback, useState } from 'react';
import { storageService } from '@/services/StorageService';
import type { EvidenceFile } from '@/types';

interface UseIndexedDBReturn {
  saveFile: (file: EvidenceFile) => Promise<void>;
  getFile: (id: string) => Promise<EvidenceFile | null>;
  getFilesByControl: (controlId: string) => Promise<EvidenceFile[]>;
  deleteFile: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook que proporciona operaciones CRUD asíncronas sobre IndexedDB
 * para ficheros de evidencia, con manejo de estados de carga y error.
 */
export function useIndexedDB(): UseIndexedDBReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveFile = useCallback(async (file: EvidenceFile): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await storageService.saveFile(file);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al guardar el archivo en la base de datos.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFile = useCallback(async (id: string): Promise<EvidenceFile | null> => {
    setLoading(true);
    setError(null);
    try {
      const file = await storageService.getFile(id);
      return file;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al recuperar el archivo de la base de datos.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFilesByControl = useCallback(async (controlId: string): Promise<EvidenceFile[]> => {
    setLoading(true);
    setError(null);
    try {
      const files = await storageService.getFilesByControl(controlId);
      return files;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al recuperar los archivos del control.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await storageService.deleteFile(id);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al eliminar el archivo de la base de datos.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saveFile,
    getFile,
    getFilesByControl,
    deleteFile,
    loading,
    error,
    clearError,
  };
}
