import '@testing-library/jest-dom';

// Polyfill localStorage for jsdom environment if not fully available
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const createLocalStorageMock = () => {
    let store: Record<string, string> = {};

    const mock = {
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem(key: string, value: string): void {
        store[key] = String(value);
      },
      removeItem(key: string): void {
        delete store[key];
      },
      clear(): void {
        store = {};
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key(index: number): string | null {
        return Object.keys(store)[index] ?? null;
      },
      /** Helper for tests: returns all keys */
      _getKeys(): string[] {
        return Object.keys(store);
      },
    };

    return mock;
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
  });
}
