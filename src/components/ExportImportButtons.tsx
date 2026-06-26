import { useRef, useState, type ChangeEvent } from 'react';
import './ExportImportButtons.css';

interface ExportImportButtonsProps {
  onExport: () => void;
  onImport: (fileContent: string) => { success: boolean; error?: string };
  onNewAudit: () => void;
}

export function ExportImportButtons({ onExport, onImport, onNewAudit }: ExportImportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNewAuditConfirm, setShowNewAuditConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  function handleImportClick() {
    setErrorMessage(null);
    fileInputRef.current?.click();
  }

  function handleNewAuditClick() {
    setShowNewAuditConfirm(true);
    setConfirmText('');
  }

  function handleConfirmNewAudit() {
    if (confirmText.toLowerCase() === 'confirmar') {
      setShowNewAuditConfirm(false);
      setConfirmText('');
      onNewAudit();
    }
  }

  function handleCancelNewAudit() {
    setShowNewAuditConfirm(false);
    setConfirmText('');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const result = onImport(content);
      if (!result.success) {
        setErrorMessage(
          result.error ?? 'El formato del archivo importado no es válido'
        );
      } else {
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo');
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported if needed
    event.target.value = '';
  }

  return (
    <div className="export-import-buttons">
      <button
        type="button"
        className="export-import-buttons__btn export-import-buttons__btn--export"
        onClick={onExport}
        aria-label="Exportar datos de auditoría"
      >
        Exportar auditoría
      </button>
      <button
        type="button"
        className="export-import-buttons__btn export-import-buttons__btn--import"
        onClick={handleImportClick}
        aria-label="Importar datos de auditoría"
      >
        Importar auditoría
      </button>
      <button
        type="button"
        className="export-import-buttons__btn export-import-buttons__btn--new"
        onClick={handleNewAuditClick}
        aria-label="Iniciar nueva auditoría"
      >
        Nueva auditoría
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {errorMessage && (
        <p role="alert" className="export-import-buttons__error">
          {errorMessage}
        </p>
      )}
      {showNewAuditConfirm && (
        <div className="export-import-buttons__confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="new-audit-title">
          <div className="export-import-buttons__confirm-dialog">
            <h3 id="new-audit-title" className="export-import-buttons__confirm-title">
              ⚠️ Nueva auditoría
            </h3>
            <p className="export-import-buttons__confirm-text">
              Esta acción eliminará todos los datos de la auditoría actual (estados de cumplimiento, comentarios y enlaces de evidencia). Esta operación no se puede deshacer.
            </p>
            <p className="export-import-buttons__confirm-text">
              Escribe <strong>confirmar</strong> para continuar:
            </p>
            <input
              type="text"
              className="export-import-buttons__confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe confirmar"
              autoFocus
              aria-label="Escribe confirmar para iniciar nueva auditoría"
            />
            <div className="export-import-buttons__confirm-actions">
              <button
                type="button"
                className="export-import-buttons__btn export-import-buttons__btn--import"
                onClick={handleCancelNewAudit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="export-import-buttons__btn export-import-buttons__btn--danger"
                onClick={handleConfirmNewAudit}
                disabled={confirmText.toLowerCase() !== 'confirmar'}
              >
                Resetear auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
