import { useState, useCallback, useRef } from 'react';

/**
 * Hook genérico para lectura/escritura en localStorage con manejo de errores.
 * Detecta si localStorage no está disponible y expone un estado de error en español.
 *
 * @param key - Clave de localStorage
 * @param initialValue - Valor inicial si no existe dato almacenado
 * @returns [storedValue, setValue, error]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, string | null] {
  // Use a ref to compute initial error synchronously during first render
  const initialError = useRef<string | null>(null);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (!isLocalStorageAvailable()) {
        initialError.current = 'El almacenamiento local no está disponible en este navegador.';
        return initialValue;
      }
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch {
      initialError.current = 'Error al leer los datos del almacenamiento local.';
      return initialValue;
    }
  });

  const [error, setError] = useState<string | null>(initialError.current);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        if (!isLocalStorageAvailable()) {
          setError('El almacenamiento local no está disponible en este navegador.');
          return;
        }

        setStoredValue((prevValue) => {
          const valueToStore = value instanceof Function ? value(prevValue) : value;

          try {
            localStorage.setItem(key, JSON.stringify(valueToStore));
            setError(null);
          } catch (e) {
            if (isQuotaError(e)) {
              setError('No se pueden guardar los datos: el almacenamiento local está lleno.');
            } else {
              setError('Error al guardar los datos en el almacenamiento local.');
            }
          }

          return valueToStore;
        });
      } catch {
        setError('Error al guardar los datos en el almacenamiento local.');
      }
    },
    [key]
  );

  return [storedValue, setValue, error];
}

/**
 * Comprueba si localStorage está disponible en el navegador actual.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__useLocalStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determina si un error es de cuota excedida.
 */
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.code === 22;
  }
  return false;
}
