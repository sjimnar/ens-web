import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ChartEvent, ActiveElement } from 'chart.js';
import type { ComplianceStatus, ProgressDistribution } from '../types';
import './PieChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  distribution: ProgressDistribution;
  activeStatus?: ComplianceStatus | null;
  onStatusClick?: (status: ComplianceStatus) => void;
}

const STATUS_LABELS: ComplianceStatus[] = ['Pendiente', 'En progreso', 'Cumplido', 'No aplica'];

const STATUS_COLORS = {
  background: [
    '#9ca3af', // Pendiente - gris
    '#d97706', // En progreso - naranja/amarillo
    '#16a34a', // Cumplido - verde
    '#93c5fd', // No aplica - azul claro
  ],
  border: [
    '#6b7280',
    '#b45309',
    '#15803d',
    '#60a5fa',
  ],
};

function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

export function PieChart({ distribution, activeStatus, onStatusClick }: PieChartProps) {
  const { pendiente, enProgreso, cumplido, noAplica, total } = distribution;

  const handleClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0 && onStatusClick) {
      const index = elements[0].index;
      onStatusClick(STATUS_LABELS[index]);
    }
  };

  const data = {
    labels: STATUS_LABELS,
    datasets: [
      {
        data: [pendiente, enProgreso, cumplido, noAplica],
        backgroundColor: STATUS_COLORS.background,
        borderColor: STATUS_COLORS.border,
        borderWidth: STATUS_LABELS.map((label) =>
          activeStatus === label ? 4 : 1
        ),
        offset: STATUS_LABELS.map((label) =>
          activeStatus === label ? 8 : 0
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          generateLabels: (chart: ChartJS) => {
            const dataset = chart.data.datasets[0];
            const dataValues = dataset.data as number[];
            return STATUS_LABELS.map((label, i) => ({
              text: `${label}: ${dataValues[i]} (${calculatePercentage(dataValues[i], total)}%)`,
              fillStyle: (dataset.backgroundColor as string[])[i],
              strokeStyle: (dataset.borderColor as string[])[i],
              lineWidth: 1,
              hidden: false,
              index: i,
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { label?: string; parsed: number }) => {
            const value = context.parsed;
            const percentage = calculatePercentage(value, total);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (total === 0) {
    return (
      <div className="pie-chart-container">
        <h3 className="pie-chart-title">Progreso de la auditoría</h3>
        <p className="pie-chart-empty">No hay controles aplicables para mostrar.</p>
      </div>
    );
  }

  const complianceScore = total > 0
    ? Math.round(((cumplido + noAplica) / total) * 100)
    : 0;

  return (
    <div className="pie-chart-container">
      <h3 className="pie-chart-title">Progreso de la auditoría</h3>
      <div className="pie-chart-body">
        <div className="pie-chart-wrapper">
          <Doughnut data={data} options={options} />
        </div>
        <div className="pie-chart-score">
          <span className="pie-chart-score__value">{complianceScore}%</span>
          <span className="pie-chart-score__label">Cumplimiento</span>
          <span className="pie-chart-score__detail">{cumplido + noAplica} de {total} controles</span>
        </div>
      </div>
      <p className="pie-chart-total">
        Total de controles: {total}
      </p>
    </div>
  );
}
