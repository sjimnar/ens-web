import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { controlsService } from '@/services/ControlsService';
import { useAuditState } from '@/hooks/useAuditState';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { ComplianceStatusSelector } from '@/components/ComplianceStatusSelector';
import { RequisitosBOE } from '@/components/RequisitosBOE';
import { RefuerzosList } from '@/components/RefuerzosList';
import { EvidenceSection } from '@/components/EvidenceSection';
import { CommentField } from '@/components/CommentField';
import { ENSTextRenderer } from '@/utils/textParser';
import type { ControlENS, EvidenceFile, EvidenceLink } from '@/types';
import './ControlDetailPage.css';

export function ControlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const controlId = id ?? '';

  const [control, setControl] = useState<ControlENS | null>(null);
  const [files, setFiles] = useState<EvidenceFile[]>([]);

  const {
    level,
    controlStates,
    setControlStatus,
    setComment,
    setResponsible,
    addEvidenceLink,
    removeEvidenceLink,
  } = useAuditState();

  const { saveFile, getFilesByControl, deleteFile } = useIndexedDB();

  // Build valid control IDs set for text rendering
  const validControlIds = useMemo(() => {
    const allControls = controlsService.loadControls();
    return new Set(allControls.map((c) => c.control_id.toLowerCase()));
  }, []);

  // Load control data
  useEffect(() => {
    const allControls = controlsService.loadControls();
    const found = allControls.find((c) => c.control_id === controlId) ?? null;
    setControl(found);
  }, [controlId]);

  // Load files from IndexedDB
  useEffect(() => {
    async function loadFiles() {
      if (!controlId) return;
      try {
        const controlFiles = await getFilesByControl(controlId);
        setFiles(controlFiles);
      } catch {
        // Error is already handled by useIndexedDB hook (sets error state)
      }
    }
    loadFiles();
  }, [controlId, getFilesByControl]);

  const controlState = controlStates[controlId];
  const currentStatus = controlState?.status ?? 'Pendiente';
  const currentComment = controlState?.comment ?? '';
  const currentResponsible = controlState?.responsible ?? '';
  const evidenceLinks: EvidenceLink[] = controlState?.evidenceLinks ?? [];

  const handleAddLink = useCallback(
    (link: EvidenceLink) => {
      addEvidenceLink(controlId, link);
    },
    [controlId, addEvidenceLink]
  );

  const handleRemoveLink = useCallback(
    (linkId: string) => {
      removeEvidenceLink(controlId, linkId);
    },
    [controlId, removeEvidenceLink]
  );

  const handleAddFile = useCallback(
    async (file: EvidenceFile) => {
      await saveFile(file);
      setFiles((prev) => [...prev, file]);
    },
    [saveFile]
  );

  const handleRemoveFile = useCallback(
    async (fileId: string) => {
      await deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    [deleteFile]
  );

  const handleCommentChange = useCallback(
    (comment: string) => {
      setComment(controlId, comment);
    },
    [controlId, setComment]
  );

  const [activeTab, setActiveTab] = useState<'requisitos' | 'evidencias' | 'guia'>('requisitos');

  if (!control) {
    return (
      <div className="control-detail-page">
        <Link to="/controls" className="control-detail-page__back">
          ← Volver a la lista
        </Link>
        <p className="control-detail-page__not-found">
          No se encontró el control con ID: {controlId}
        </p>
      </div>
    );
  }

  return (
    <div className="control-detail-page">
      {/* Header — siempre visible */}
      <header className="control-detail-page__header">
        <h2 className="control-detail-page__title">
          <span className="control-detail-page__id">{control.control_id}</span>
          {control.name}
        </h2>
        <div className="control-detail-page__meta">
          <span className="control-detail-page__category">{control.category_name}</span>
          {control.dimensions && (
            <span className="control-detail-page__dimensions">{control.dimensions}</span>
          )}
        </div>

        {/* Estado + Responsable en la cabecera */}
        <div className="control-detail-page__actions">
          <ComplianceStatusSelector
            value={currentStatus}
            onChange={(status) => setControlStatus(controlId, status)}
            controlId={controlId}
          />
          <div className="control-detail-page__responsible">
            <label htmlFor={`responsible-${controlId}`} className="control-detail-page__responsible-label">
              Responsable
            </label>
            <select
              id={`responsible-${controlId}`}
              className="control-detail-page__responsible-select"
              value={currentResponsible}
              onChange={(e) => setResponsible(controlId, e.target.value)}
            >
              <option value="">Sin asignar</option>
              <option value="Infraestructuras">Infraestructuras</option>
              <option value="Security">Security</option>
              <option value="Cloud">Cloud</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="RRHH">RRHH</option>
              <option value="Dirección">Dirección</option>
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="control-detail-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'requisitos'}
          className={`control-detail-page__tab${activeTab === 'requisitos' ? ' control-detail-page__tab--active' : ''}`}
          onClick={() => setActiveTab('requisitos')}
        >
          Requisitos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'evidencias'}
          className={`control-detail-page__tab${activeTab === 'evidencias' ? ' control-detail-page__tab--active' : ''}`}
          onClick={() => setActiveTab('evidencias')}
        >
          Evidencias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'guia'}
          className={`control-detail-page__tab${activeTab === 'guia' ? ' control-detail-page__tab--active' : ''}`}
          onClick={() => setActiveTab('guia')}
        >
          Guía
        </button>
      </nav>

      {/* Tab content */}
      <div className="control-detail-page__tab-content">
        {/* TAB: Requisitos */}
        {activeTab === 'requisitos' && (
          <div className="control-detail-page__panel">
            {control.measure_description && (
              <section className="control-detail-page__section">
                <h3 className="control-detail-page__section-title">Descripción de la medida</h3>
                <p className="control-detail-page__section-text">
                  <ENSTextRenderer text={control.measure_description} validControlIds={validControlIds} />
                </p>
              </section>
            )}

            <RequisitosBOE requisitosBase={control.requisitos_base} controlId={controlId} />
            <RefuerzosList control={control} level={level} />

            {control.observation && (
              <section className="control-detail-page__section">
                <h3 className="control-detail-page__section-title">Observaciones</h3>
                <p className="control-detail-page__section-text">
                  <ENSTextRenderer text={control.observation} validControlIds={validControlIds} />
                </p>
              </section>
            )}
          </div>
        )}

        {/* TAB: Evidencias */}
        {activeTab === 'evidencias' && (
          <div className="control-detail-page__panel">
            <CommentField value={currentComment} onChange={handleCommentChange} />

            <EvidenceSection
              controlId={controlId}
              evidenceLinks={evidenceLinks}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onAddFile={handleAddFile}
              onRemoveFile={handleRemoveFile}
              files={files}
            />
          </div>
        )}

        {/* TAB: Guía */}
        {activeTab === 'guia' && (
          <div className="control-detail-page__panel">
            {control.documentation_guidance && (
              <section className="control-detail-page__section">
                <h3 className="control-detail-page__section-title">Guía de documentación</h3>
                <p className="control-detail-page__section-text">
                  <ENSTextRenderer text={control.documentation_guidance} validControlIds={validControlIds} />
                </p>
              </section>
            )}

            {control.evidence_guidance && (
              <section className="control-detail-page__section">
                <h3 className="control-detail-page__section-title">Guía de evidencias</h3>
                <p className="control-detail-page__section-text">
                  <ENSTextRenderer text={control.evidence_guidance} validControlIds={validControlIds} />
                </p>
              </section>
            )}

            {control.evidence_examples && (
              <section className="control-detail-page__section">
                <h3 className="control-detail-page__section-title">Ejemplo de evidencias válidas</h3>
                <p className="control-detail-page__section-text">
                  <ENSTextRenderer text={control.evidence_examples} validControlIds={validControlIds} />
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlDetailPage;
