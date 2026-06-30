import { useState, useRef } from 'react';
import type { EvidenceLink, EvidenceFile } from '../types';
import './EvidenceSection.css';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface EvidenceSectionProps {
  controlId: string;
  evidenceLinks: EvidenceLink[];
  onAddLink: (link: EvidenceLink) => void;
  onRemoveLink: (linkId: string) => void;
  onAddFile: (file: EvidenceFile) => void;
  onRemoveFile: (fileId: string) => void;
  files: EvidenceFile[];
}

export function EvidenceSection({
  controlId,
  evidenceLinks,
  onAddLink,
  onRemoveLink,
  onAddFile,
  onRemoveFile,
  files,
}: EvidenceSectionProps) {
  const [urlValue, setUrlValue] = useState('');
  const [urlLabel, setUrlLabel] = useState('');
  const [urlError, setUrlError] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddLink() {
    setUrlError('');

    if (!isValidUrl(urlValue.trim())) {
      setUrlError('La URL introducida no es válida');
      return;
    }

    const newLink: EvidenceLink = {
      id: crypto.randomUUID(),
      controlId,
      url: urlValue.trim(),
      label: urlLabel.trim() || urlValue.trim(),
      addedAt: new Date().toISOString(),
    };

    onAddLink(newLink);
    setUrlValue('');
    setUrlLabel('');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError('El archivo excede el tamaño máximo de 30 MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as ArrayBuffer;
      const evidenceFile: EvidenceFile = {
        id: crypto.randomUUID(),
        controlId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data,
        addedAt: new Date().toISOString(),
      };
      onAddFile(evidenceFile);
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDownloadFile(evidenceFile: EvidenceFile) {
    const blob = new Blob([evidenceFile.data], { type: evidenceFile.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = evidenceFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="evidence-section" aria-labelledby={`evidence-heading-${controlId}`}>
      <h3 id={`evidence-heading-${controlId}`} className="evidence-heading">
        Evidencias
      </h3>

      {/* URL form */}
      <div className="evidence-form">
        <div className="evidence-form-row">
          <label htmlFor={`evidence-url-${controlId}`} className="evidence-label">
            URL
          </label>
          <input
            id={`evidence-url-${controlId}`}
            type="url"
            className="evidence-input"
            placeholder="https://ejemplo.com/evidencia"
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
              if (urlError) setUrlError('');
            }}
          />
        </div>
        <div className="evidence-form-row">
          <label htmlFor={`evidence-label-${controlId}`} className="evidence-label">
            Etiqueta (opcional)
          </label>
          <input
            id={`evidence-label-${controlId}`}
            type="text"
            className="evidence-input"
            placeholder="Descripción del enlace"
            value={urlLabel}
            onChange={(e) => setUrlLabel(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="evidence-btn evidence-btn-add"
          onClick={handleAddLink}
        >
          Añadir enlace
        </button>
        {urlError && (
          <p className="evidence-error" role="alert">
            {urlError}
          </p>
        )}
      </div>

      {/* File upload form */}
      <div className="evidence-form">
        <div className="evidence-form-row">
          <label htmlFor={`evidence-file-${controlId}`} className="evidence-label">
            Archivo (máx. 30 MB)
          </label>
          <input
            id={`evidence-file-${controlId}`}
            type="file"
            className="evidence-file-input"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <button
          type="button"
          className="evidence-btn evidence-btn-add"
          onClick={() => fileInputRef.current?.click()}
        >
          Adjuntar archivo
        </button>
        {fileError && (
          <p className="evidence-error" role="alert">
            {fileError}
          </p>
        )}
      </div>

      {/* Evidence links list */}
      {evidenceLinks.length > 0 && (
        <div className="evidence-list">
          <h4 className="evidence-list-heading">Enlaces</h4>
          <ul className="evidence-items">
            {evidenceLinks.map((link) => (
              <li key={link.id} className="evidence-item">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="evidence-link"
                >
                  {link.label || link.url}
                </a>
                <button
                  type="button"
                  className="evidence-btn evidence-btn-remove"
                  onClick={() => onRemoveLink(link.id)}
                  aria-label={`Eliminar enlace ${link.label || link.url}`}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence files list */}
      {files.length > 0 && (
        <div className="evidence-list">
          <h4 className="evidence-list-heading">Archivos</h4>
          <ul className="evidence-items">
            {files.map((file) => (
              <li key={file.id} className="evidence-item">
                <span className="evidence-filename">{file.filename}</span>
                <div className="evidence-file-actions">
                  <button
                    type="button"
                    className="evidence-btn evidence-btn-download"
                    onClick={() => handleDownloadFile(file)}
                    aria-label={`Descargar ${file.filename}`}
                  >
                    Descargar
                  </button>
                  <button
                    type="button"
                    className="evidence-btn evidence-btn-remove"
                    onClick={() => onRemoveFile(file.id)}
                    aria-label={`Eliminar archivo ${file.filename}`}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
