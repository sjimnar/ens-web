import type { AuditState, ExportData, NivelENS } from '@/types';

const EXPORT_VERSION = '1.0';

class ExportImportService {
  /**
   * Serializa el estado de auditoría a formato de exportación.
   */
  exportAuditData(state: AuditState): ExportData {
    return {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      level: state.level,
      controls: state.controls,
    };
  }

  /**
   * Genera el nombre de archivo para la exportación.
   * Formato: auditoria-ens-{nivel}-{YYYY-MM-DD}.json
   */
  generateFilename(level: NivelENS, date: Date): string {
    const levelStr = this.normalizeLevelForFilename(level);
    const dateStr = date.toISOString().slice(0, 10);
    return `auditoria-ens-${levelStr}-${dateStr}.json`;
  }

  /**
   * Dispara la descarga de un archivo JSON en el navegador.
   */
  downloadAsJson(data: ExportData, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  /**
   * Intenta parsear un string como JSON de exportación.
   * Retorna null si el contenido no es JSON válido.
   */
  parseImportFile(content: string): ExportData | null {
    try {
      const parsed: unknown = JSON.parse(content);
      if (this.validateImportData(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Valida que un objeto desconocido tenga la estructura de ExportData.
   */
  validateImportData(data: unknown): data is ExportData {
    if (data === null || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.version !== 'string') return false;
    if (typeof obj.exportDate !== 'string') return false;
    if (!this.isValidLevel(obj.level)) return false;
    if (obj.controls === null || typeof obj.controls !== 'object') return false;

    return true;
  }

  /**
   * Fusiona datos importados con el estado existente.
   * Los datos importados reemplazan/actualizan los controles existentes.
   * El nivel del archivo importado tiene prioridad.
   */
  mergeImportedData(existing: AuditState, imported: ExportData): AuditState {
    return {
      level: imported.level,
      controls: {
        ...existing.controls,
        ...imported.controls,
      },
      lastModified: new Date().toISOString(),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────

  private normalizeLevelForFilename(level: NivelENS): string {
    switch (level) {
      case 'BÁSICO':
        return 'basico';
      case 'MEDIO':
        return 'medio';
      case 'ALTO':
        return 'alto';
    }
  }

  private isValidLevel(value: unknown): value is NivelENS {
    return value === 'BÁSICO' || value === 'MEDIO' || value === 'ALTO';
  }
}

export const exportImportService = new ExportImportService();
export { ExportImportService };
