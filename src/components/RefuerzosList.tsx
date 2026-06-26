import { useMemo } from 'react';
import { controlsService } from '@/services/ControlsService';
import { ENSTextRenderer } from '@/utils/textParser';
import type { ControlENS, NivelENS, Refuerzo } from '@/types';
import './RefuerzosList.css';

export interface RefuerzosListProps {
  control: ControlENS;
  level: NivelENS;
}

/**
 * Detecta si un refuerzo forma parte de un grupo alternativo (formato "[R1 o R2]")
 * en la cadena de aplicabilidad del control para el nivel dado.
 */
function getAlternativeGroup(
  control: ControlENS,
  level: NivelENS,
  refuerzoId: string
): string | null {
  const levelKeys: Record<NivelENS, keyof typeof control.applicability> = {
    'BÁSICO': 'basica',
    'MEDIO': 'media',
    'ALTO': 'alta',
  };
  const value = control.applicability[levelKeys[level]];

  // Match groups like [R1 o R2] or [R1 o R2 o R3]
  const groupRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = groupRegex.exec(value)) !== null) {
    const groupContent = match[1]; // e.g. "R1 o R2 o R3"
    const ids = groupContent.match(/R\d+/g);
    if (ids && ids.includes(refuerzoId)) {
      return match[0]; // e.g. "[R1 o R2]"
    }
  }

  return null;
}

export function RefuerzosList({ control, level }: RefuerzosListProps) {
  const refuerzos: Refuerzo[] = controlsService.getApplicableRefuerzos(control, level);

  const validControlIds = useMemo(() => {
    const allControls = controlsService.loadControls();
    return new Set(allControls.map((c) => c.control_id.toLowerCase()));
  }, []);

  return (
    <section className="refuerzos-list" aria-label="Refuerzos aplicables">
      <h4 className="refuerzos-list__header">Refuerzos aplicables</h4>

      {refuerzos.length === 0 ? (
        <p className="refuerzos-list__empty">
          No hay refuerzos aplicables para este nivel
        </p>
      ) : (
        <div className="refuerzos-list__items">
          {refuerzos.map((refuerzo) => {
            const altGroup = getAlternativeGroup(control, level, refuerzo.id);
            const isAlternativo = altGroup !== null;

            return (
              <div
                key={refuerzo.id}
                className="refuerzo-item"
                aria-label={`Refuerzo ${refuerzo.id}: ${refuerzo.name}`}
              >
                <div className="refuerzo-item__header">
                  <span
                    className={`refuerzo-item__id${isAlternativo ? ' refuerzo-item__id--alternativo' : ''}`}
                  >
                    {refuerzo.id}
                  </span>
                  {isAlternativo && (
                    <span className="refuerzo-item__badge-alt" title="Alternativo: se aplica uno de ellos">
                      {altGroup}
                    </span>
                  )}
                  <span className="refuerzo-item__name">{refuerzo.name}</span>
                </div>
                <p className="refuerzo-item__description">
                  <ENSTextRenderer text={refuerzo.description} validControlIds={validControlIds} />
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
