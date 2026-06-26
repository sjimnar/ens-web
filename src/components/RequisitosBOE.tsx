import { type ReactNode, useMemo } from 'react';
import { ENSTextRenderer } from '@/utils/textParser';
import { controlsService } from '@/services/ControlsService';
import './RequisitosBOE.css';

interface RequisitosBOEProps {
  requisitosBase: string;
  controlId?: string;
}

/**
 * Builds a Set<string> of all valid control_id values (lowercased)
 * from the controls dataset.
 */
function buildValidControlIds(): Set<string> {
  const controls = controlsService.loadControls();
  return new Set(controls.map((c) => c.control_id.toLowerCase()));
}

/**
 * Splits the full text into paragraphs (on double newline or single newline)
 * and renders each paragraph with ENSTextRenderer for interactive references.
 */
function renderParagraphs(
  text: string,
  validControlIds: Set<string>
): ReactNode[] {
  const paragraphs = text.split(/\n\n|\n/).filter((p) => p.trim().length > 0);
  return paragraphs.map((paragraph, index) => (
    <p key={index} className="requisitos-boe__paragraph">
      <ENSTextRenderer
        text={paragraph.trim()}
        validControlIds={validControlIds}
      />
    </p>
  ));
}

export function RequisitosBOE({
  requisitosBase,
  controlId,
}: RequisitosBOEProps) {
  const sectionId = controlId
    ? `requisitos-boe-${controlId}`
    : 'requisitos-boe';

  const validControlIds = useMemo(() => buildValidControlIds(), []);

  if (!requisitosBase || requisitosBase.trim().length === 0) {
    return (
      <section className="requisitos-boe" aria-labelledby={sectionId}>
        <h3 id={sectionId} className="requisitos-boe__header">
          Requisitos (BOE)
        </h3>
        <p className="requisitos-boe__empty">
          No se dispone de texto de requisitos para este control.
        </p>
      </section>
    );
  }

  return (
    <section className="requisitos-boe" aria-labelledby={sectionId}>
      <h3 id={sectionId} className="requisitos-boe__header">
        Requisitos (BOE)
      </h3>
      <div className="requisitos-boe__content">
        {renderParagraphs(requisitosBase, validControlIds)}
      </div>
    </section>
  );
}
