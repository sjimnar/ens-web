import type { AuditState, ControlAuditState, EvidenceFile, NivelENS } from '@/types';

const STORAGE_PREFIX = 'ens-audit-';
const KEYS = {
  auditState: `${STORAGE_PREFIX}state`,
  level: `${STORAGE_PREFIX}level`,
  controlPrefix: `${STORAGE_PREFIX}control-`,
} as const;

const DB_NAME = 'ens-audit-db';
const DB_VERSION = 1;
const FILE_STORE = 'evidence-files';

class StorageService {
  // ─── localStorage operations ───────────────────────────────────────────

  isStorageAvailable(): boolean {
    try {
      const testKey = `${STORAGE_PREFIX}test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getAuditState(): AuditState | null {
    try {
      const raw = localStorage.getItem(KEYS.auditState);
      if (!raw) return null;
      return JSON.parse(raw) as AuditState;
    } catch {
      return null;
    }
  }

  saveAuditState(state: AuditState): void {
    try {
      localStorage.setItem(KEYS.auditState, JSON.stringify(state));
    } catch (error) {
      if (this.isQuotaError(error)) {
        throw new Error('No se puede guardar el estado de auditoría: el almacenamiento local está lleno.');
      }
      throw new Error('No se puede guardar el estado de auditoría: el almacenamiento local no está disponible.');
    }
  }

  getLevel(): NivelENS | null {
    try {
      const raw = localStorage.getItem(KEYS.level);
      if (!raw) return null;
      return raw as NivelENS;
    } catch {
      return null;
    }
  }

  saveLevel(level: NivelENS): void {
    try {
      localStorage.setItem(KEYS.level, level);
    } catch (error) {
      if (this.isQuotaError(error)) {
        throw new Error('No se puede guardar el nivel: el almacenamiento local está lleno.');
      }
      throw new Error('No se puede guardar el nivel: el almacenamiento local no está disponible.');
    }
  }

  removeLevel(): void {
    localStorage.removeItem(KEYS.level);
  }

  getControlState(controlId: string): ControlAuditState | null {
    try {
      const raw = localStorage.getItem(`${KEYS.controlPrefix}${controlId}`);
      if (!raw) return null;
      return JSON.parse(raw) as ControlAuditState;
    } catch {
      return null;
    }
  }

  saveControlState(controlId: string, state: ControlAuditState): void {
    try {
      localStorage.setItem(`${KEYS.controlPrefix}${controlId}`, JSON.stringify(state));
    } catch (error) {
      if (this.isQuotaError(error)) {
        throw new Error('No se puede guardar el estado del control: el almacenamiento local está lleno.');
      }
      throw new Error('No se puede guardar el estado del control: el almacenamiento local no está disponible.');
    }
  }

  // ─── IndexedDB operations ──────────────────────────────────────────────

  async saveFile(file: EvidenceFile): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(FILE_STORE, 'readwrite');
        const store = transaction.objectStore(FILE_STORE);
        const request = store.put(file);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          reject(new Error('Error al guardar el archivo en la base de datos.'));
        };

        transaction.onerror = () => {
          reject(new Error('Error al guardar el archivo: transacción fallida.'));
        };
      } catch {
        reject(new Error('Error al guardar el archivo en la base de datos.'));
      }
    });
  }

  async getFile(id: string): Promise<EvidenceFile | null> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(FILE_STORE, 'readonly');
        const store = transaction.objectStore(FILE_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve((request.result as EvidenceFile) ?? null);
        };
        request.onerror = () => {
          reject(new Error('Error al recuperar el archivo de la base de datos.'));
        };
      } catch {
        reject(new Error('Error al recuperar el archivo de la base de datos.'));
      }
    });
  }

  async getFilesByControl(controlId: string): Promise<EvidenceFile[]> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(FILE_STORE, 'readonly');
        const store = transaction.objectStore(FILE_STORE);
        const index = store.index('controlId');
        const request = index.getAll(controlId);

        request.onsuccess = () => {
          resolve((request.result as EvidenceFile[]) ?? []);
        };
        request.onerror = () => {
          reject(new Error('Error al recuperar los archivos del control.'));
        };
      } catch {
        reject(new Error('Error al recuperar los archivos del control.'));
      }
    });
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(FILE_STORE, 'readwrite');
        const store = transaction.objectStore(FILE_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          reject(new Error('Error al eliminar el archivo de la base de datos.'));
        };
      } catch {
        reject(new Error('Error al eliminar el archivo de la base de datos.'));
      }
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB no está disponible en este navegador. No se pueden gestionar archivos de evidencia.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          const store = db.createObjectStore(FILE_STORE, { keyPath: 'id' });
          store.createIndex('controlId', 'controlId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = () => {
        reject(new Error('No se puede abrir la base de datos. Verifique que su navegador permite el uso de IndexedDB.'));
      };
    });
  }

  private isQuotaError(error: unknown): boolean {
    if (error instanceof DOMException) {
      return error.name === 'QuotaExceededError' || error.code === 22;
    }
    return false;
  }
}

export const storageService = new StorageService();
export { StorageService };
