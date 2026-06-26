/**
 * MedidasService - Servicio para carga y mapeo de medidas técnicas a controles ENS.
 *
 * Provee funciones para:
 * - Cargar las medidas técnicas desde el JSON estático
 * - Obtener las medidas técnicas asociadas a un control dado
 * - Extraer el código del control desde un control_id compuesto
 */
import { medidasTecnicas } from '@/data';
import type { MedidaTecnica } from '@/types';

/**
 * Extrae el código del control desde un control_id que puede contener
 * una descripción después de espacios.
 *
 * Ejemplos:
 *   "op.acc.1  Control de identificadores..." → "op.acc.1"
 *   "op.acc.1" → "op.acc.1"
 */
export function extractControlCode(controlId: string): string {
  const trimmed = controlId.trim();
  if (trimmed.length === 0) return '';
  return trimmed.split(/\s+/)[0];
}

/**
 * Carga las medidas técnicas desde el JSON estático.
 * Retorna la lista completa de MedidaTecnica.
 */
export function loadMedidas(): MedidaTecnica[] {
  return medidasTecnicas as MedidaTecnica[];
}

/**
 * Obtiene las medidas técnicas asociadas a un control dado.
 *
 * La lógica de matching:
 * 1. Extrae el código del control (primera palabra del controlId)
 * 2. Para cada medida, parsea el campo controls_ens separando por ";"
 * 3. Compara el código extraído con los códigos en controls_ens
 *
 * @param controlId - El ID del control (puede incluir descripción)
 * @param medidas - Lista de medidas técnicas (opcional, carga automáticamente si no se provee)
 * @returns Lista de medidas técnicas vinculadas al control
 */
export function getMedidasForControl(
  controlId: string,
  medidas?: MedidaTecnica[]
): MedidaTecnica[] {
  const controlCode = extractControlCode(controlId);
  if (controlCode.length === 0) return [];

  const source = medidas ?? loadMedidas();

  return source.filter((m) => {
    const linkedControls = m.controls_ens
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    return linkedControls.includes(controlCode);
  });
}

/**
 * Clase MedidasService - wrapper orientado a objeto con caché interna.
 * Alternativa al uso de funciones standalone.
 */
export class MedidasService {
  private medidas: MedidaTecnica[] | null = null;

  /** Carga las medidas técnicas (con caché interna) */
  loadMedidas(): MedidaTecnica[] {
    if (this.medidas === null) {
      this.medidas = loadMedidas();
    }
    return this.medidas;
  }

  /** Obtiene las medidas técnicas asociadas a un control */
  getMedidasForControl(controlId: string): MedidaTecnica[] {
    return getMedidasForControl(controlId, this.loadMedidas());
  }

  /** Extrae el código del control desde un control_id */
  extractControlCode(controlId: string): string {
    return extractControlCode(controlId);
  }
}

/** Instancia singleton del servicio */
export const medidasService = new MedidasService();
