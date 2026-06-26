/**
 * ControlsService — Servicio para carga, filtrado y ordenación de controles ENS.
 *
 * Carga los controles desde el JSON estático ens_complete_controls.json
 * y proporciona métodos de filtrado por nivel, texto, categoría y ordenación.
 */
import controlesCompletos from '@/data/ens_complete_controls.json';
import type { ControlENS, NivelENS, Applicability, Refuerzo } from '@/types';

/**
 * Mapea un NivelENS al key correspondiente en la tabla de applicability.
 */
function levelToKey(level: NivelENS): keyof Applicability {
  switch (level) {
    case 'BÁSICO':
      return 'basica';
    case 'MEDIO':
      return 'media';
    case 'ALTO':
      return 'alta';
  }
}

/**
 * Extrae los IDs de refuerzos del string de applicability.
 * Ej: "+ R1 + R2" → ["R1", "R2"]
 * Ej: "+ [R1 o R2] + R3" → ["R1", "R2", "R3"]
 */
function parseApplicabilityRefuerzos(value: string): string[] {
  const matches = value.match(/R\d+/g);
  return matches ?? [];
}

export class ControlsService {
  /**
   * Carga todos los controles ENS desde el JSON estático.
   */
  loadControls(): ControlENS[] {
    return controlesCompletos as ControlENS[];
  }

  /**
   * Filtra controles por nivel ENS.
   * Un control aplica a un nivel si su applicability[levelKey] !== "n.a."
   */
  filterByLevel(controls: ControlENS[], level: NivelENS): ControlENS[] {
    const key = levelToKey(level);
    return controls.filter((control) => control.applicability[key] !== 'n.a.');
  }

  /**
   * Filtra controles por texto (case-insensitive).
   * Busca en control_id y measure_description.
   */
  filterByText(controls: ControlENS[], text: string): ControlENS[] {
    if (!text.trim()) {
      return controls;
    }
    const lowerText = text.toLowerCase();
    return controls.filter(
      (control) =>
        control.control_id.toLowerCase().includes(lowerText) ||
        control.measure_description.toLowerCase().includes(lowerText)
    );
  }

  /**
   * Filtra controles por categoría exacta.
   */
  filterByCategory(controls: ControlENS[], category: string): ControlENS[] {
    return controls.filter((control) => control.category === category);
  }

  /**
   * Ordena controles por el campo indicado y dirección.
   * sortBy: 'category' | 'control_id' | 'status'
   * direction: 'asc' | 'desc'
   *
   * Para 'status', al no disponer del estado de auditoría en este servicio,
   * se ordena por control_id como fallback.
   */
  sortControls(
    controls: ControlENS[],
    sortBy: string,
    direction: string
  ): ControlENS[] {
    const sorted = [...controls];
    const dir = direction === 'desc' ? -1 : 1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'category':
          comparison = a.category.localeCompare(b.category);
          if (comparison === 0) {
            comparison = a.control_id.localeCompare(b.control_id);
          }
          break;
        case 'control_id':
          comparison = a.control_id.localeCompare(b.control_id);
          break;
        case 'status':
          // Sin acceso al estado de auditoría, fallback a control_id
          comparison = a.control_id.localeCompare(b.control_id);
          break;
        default:
          comparison = a.control_id.localeCompare(b.control_id);
          break;
      }

      return comparison * dir;
    });

    return sorted;
  }

  /**
   * Extrae la lista única de categorías de un conjunto de controles.
   * Mantiene el orden de primera aparición.
   */
  getCategories(controls: ControlENS[]): string[] {
    const seen = new Set<string>();
    const categories: string[] = [];

    for (const control of controls) {
      if (!seen.has(control.category)) {
        seen.add(control.category);
        categories.push(control.category);
      }
    }

    return categories;
  }

  /**
   * Obtiene los refuerzos aplicables a un control según el nivel seleccionado.
   */
  getApplicableRefuerzos(control: ControlENS, level: NivelENS): Refuerzo[] {
    const key = levelToKey(level);
    const applicabilityValue = control.applicability[key];

    if (applicabilityValue === 'n.a.' || applicabilityValue === 'aplica') {
      return [];
    }

    const refuerzoIds = parseApplicabilityRefuerzos(applicabilityValue);
    return control.refuerzos.filter((r) => refuerzoIds.includes(r.id));
  }
}

/** Instancia singleton del servicio de controles */
export const controlsService = new ControlsService();
