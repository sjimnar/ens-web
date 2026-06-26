import type { ControlENS, ComplianceStatus } from '../types';

export interface ControlCardProps {
  control: ControlENS;
  status: ComplianceStatus;
  onClick: () => void;
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; className: string }> = {
  'Pendiente': { label: 'Pendiente', color: '#9ca3af', className: 'control-card__badge--pendiente' },
  'En progreso': { label: 'En progreso', color: '#d97706', className: 'control-card__badge--en-progreso' },
  'Cumplido': { label: 'Cumplido', color: '#16a34a', className: 'control-card__badge--cumplido' },
  'No aplica': { label: 'No aplica', color: '#d1d5db', className: 'control-card__badge--no-aplica' },
};

const MAX_DESCRIPTION_LENGTH = 120;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function ControlCard({ control, status, onClick }: ControlCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <article
      className="control-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Control ${control.control_id}: ${control.name}`}
    >
      <div className="control-card__header">
        <span className="control-card__id">{control.control_id}</span>
        <span
          className={`control-card__badge ${statusConfig.className}`}
          style={{ backgroundColor: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
      </div>
      <h3 className="control-card__name">{control.name}</h3>
      <p className="control-card__description">
        {truncateText(control.measure_description, MAX_DESCRIPTION_LENGTH)}
      </p>
    </article>
  );
}
