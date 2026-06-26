import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve el valor inicial cuando no hay datos guardados', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value, , error] = result.current;

    expect(value).toBe('default');
    expect(error).toBeNull();
  });

  it('lee un valor existente de localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value, , error] = result.current;

    expect(value).toBe('stored-value');
    expect(error).toBeNull();
  });

  it('guarda un valor nuevo en localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
    expect(result.current[2]).toBeNull();
  });

  it('acepta una función de actualización', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('counter')).toBe('1');
  });

  it('maneja objetos complejos con serialización JSON', () => {
    interface TestData {
      name: string;
      items: number[];
    }

    const initial: TestData = { name: 'test', items: [1, 2, 3] };
    const { result } = renderHook(() => useLocalStorage<TestData>('complex', initial));

    const updated: TestData = { name: 'updated', items: [4, 5] };
    act(() => {
      result.current[1](updated);
    });

    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('complex')!)).toEqual(updated);
  });

  it('muestra error en español cuando localStorage no está disponible', () => {
    // Replace localStorage entirely with one that throws on all operations
    const originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => { throw new DOMException('Access denied', 'SecurityError'); },
        setItem: () => { throw new DOMException('Access denied', 'SecurityError'); },
        removeItem: () => { throw new DOMException('Access denied', 'SecurityError'); },
        clear: () => { throw new DOMException('Access denied', 'SecurityError'); },
        length: 0,
        key: () => null,
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useLocalStorage('unavailable-key', 'default'));

    expect(result.current[0]).toBe('default');
    expect(result.current[2]).toBe('El almacenamiento local no está disponible en este navegador.');

    // Restore
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('muestra error en español cuando el almacenamiento está lleno al escribir', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    // Replace localStorage with one that passes availability check but fails on actual writes
    const originalLocalStorage = globalThis.localStorage;
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
        setItem: (key: string) => {
          if (key === '__useLocalStorage_test__') {
            // Allow the availability check to pass - but we need removeItem too
            return;
          }
          throw quotaError;
        },
        removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
        clear: originalLocalStorage.clear.bind(originalLocalStorage),
        length: originalLocalStorage.length,
        key: originalLocalStorage.key.bind(originalLocalStorage),
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      result.current[1]('large-data');
    });

    // Value is still updated in state even though localStorage write fails
    expect(result.current[0]).toBe('large-data');
    expect(result.current[2]).toBe('No se pueden guardar los datos: el almacenamiento local está lleno.');

    // Restore
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('muestra error en español cuando falla la lectura de datos corruptos', () => {
    // Store invalid JSON
    localStorage.setItem('corrupt-key', '{invalid-json');

    const { result } = renderHook(() => useLocalStorage('corrupt-key', 'fallback'));
    const [value, , error] = result.current;

    expect(value).toBe('fallback');
    expect(error).toBe('Error al leer los datos del almacenamiento local.');
  });

  it('limpia el error tras una escritura exitosa', () => {
    // Start with corrupt data
    localStorage.setItem('test-key', '{bad-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    // Should have error from read
    expect(result.current[2]).not.toBeNull();

    // Now write successfully
    act(() => {
      result.current[1]('valid-data');
    });

    expect(result.current[0]).toBe('valid-data');
    expect(result.current[2]).toBeNull();
  });
});
