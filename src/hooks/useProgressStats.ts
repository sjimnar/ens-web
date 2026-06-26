import { useMemo } from 'react';
import type { ControlENS, ControlAuditState, ProgressDistribution } from '../types';

/**
 * Calcula la distribución de progreso (para el pie chart) a partir de
 * los controles aplicables al nivel actual y los estados de auditoría.
 *
 * - Acepta controles ya filtrados por nivel.
 * - Si un control no tiene estado guardado, se cuenta como 'Pendiente'.
 * - La suma pendiente + enProgreso + cumplido + noAplica === total siempre.
 */
export function calculateProgress(
  controls: ControlENS[],
  auditStates: Record<string, ControlAuditState>
): ProgressDistribution {
  const distribution: ProgressDistribution = {
    pendiente: 0,
    enProgreso: 0,
    cumplido: 0,
    noAplica: 0,
    total: controls.length,
  };

  for (const control of controls) {
    const state = auditStates[control.control_id];
    const status = state?.status ?? 'Pendiente';
    switch (status) {
      case 'Pendiente':
        distribution.pendiente++;
        break;
      case 'En progreso':
        distribution.enProgreso++;
        break;
      case 'Cumplido':
        distribution.cumplido++;
        break;
      case 'No aplica':
        distribution.noAplica++;
        break;
    }
  }

  return distribution;
}

/**
 * Hook que recalcula la distribución de progreso automáticamente
 * cuando cambian los controles o los estados de cumplimiento.
 */
export function useProgressStats(
  controls: ControlENS[],
  auditStates: Record<string, ControlAuditState>
): ProgressDistribution {
  return useMemo(
    () => calculateProgress(controls, auditStates),
    [controls, auditStates]
  );
}
