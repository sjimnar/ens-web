import type { ComplianceStatus } from '../types';
import './ComplianceStatusSelector.css';

interface ComplianceStatusSelectorProps {
  value: ComplianceStatus;
  onChange: (status: ComplianceStatus) => void;
  controlId?: string;
}

const STATUS_OPTIONS: { value: ComplianceStatus; label: string; color: string }[] = [
  { value: 'Pendiente', label: 'Pendiente', color: '#9ca3af' },
  { value: 'En progreso', label: 'En progreso', color: '#d97706' },
  { value: 'Cumplido', label: 'Cumplido', color: '#16a34a' },
  { value: 'No aplica', label: 'No aplica', color: '#d1d5db' },
];

function getStatusColor(status: ComplianceStatus): string {
  return STATUS_OPTIONS.find(opt => opt.value === status)?.color ?? '#9ca3af';
}

export function ComplianceStatusSelector({
  value,
  onChange,
  controlId,
}: ComplianceStatusSelectorProps) {
  const selectId = controlId
    ? `compliance-status-${controlId}`
    : 'compliance-status';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as ComplianceStatus);
  }

  return (
    <div className="compliance-status-selector">
      <label htmlFor={selectId} className="compliance-status-label">
        Estado de cumplimiento
      </label>
      <div className="compliance-status-control">
        <span
          className="compliance-status-dot"
          style={{ backgroundColor: getStatusColor(value) }}
          aria-hidden="true"
        />
        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          className="compliance-status-select"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
