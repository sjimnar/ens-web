/**
 * Módulo de carga de datos estáticos ENS.
 * Exporta los controles completos tipados y datos auxiliares.
 */
import type { ControlENS } from '../types';
import ensCompleteControlsData from './ens_complete_controls.json';
import controlesData from './controles_ens.json';
import medidasData from './medidas_tecnicas.json';

/** Lista completa de controles ENS (73 controles Anexo II) tipados según la interfaz ControlENS */
export const ensCompleteControls: ControlENS[] = ensCompleteControlsData as ControlENS[];

/** Estructura de un control ENS del fichero controles_ens.json (formato simplificado) */
export interface ControlENSRaw {
  category: string;
  category_description: string;
  control_id: string;
  measure: string;
  documentation: string;
  evidence: string;
  observation: string;
}

/** Estructura de una medida técnica */
export interface MedidaTecnicaRaw {
  id: string;
  element: string;
  controls_ens: string;
  technical_measure: string;
  strategic_observation: string;
  technical_observation: string;
  responsible: string;
  evidence_type: string;
  status: string;
  ticket: string;
  control_status: string;
  last_review: string;
}

/** Lista de controles ENS del fichero simplificado */
export const controles: ControlENSRaw[] = controlesData as ControlENSRaw[];

/** Lista completa de medidas técnicas cargadas del JSON estático */
export const medidasTecnicas: MedidaTecnicaRaw[] = medidasData.medidas as MedidaTecnicaRaw[];

/** Mapeo auxiliar (si existe en el JSON) */
export const mapeoMedidas = medidasData.mapeo;
