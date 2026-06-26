import type { NivelENS } from '../types';

interface LevelSelectorProps {
  onSelectLevel: (level: NivelENS) => void;
}

const levels: { level: NivelENS; description: string; controls: number }[] = [
  {
    level: 'BÁSICO',
    description: 'Sistemas con información y servicios de categoría básica. 52 controles aplicables.',
    controls: 52,
  },
  {
    level: 'MEDIO',
    description: 'Sistemas con información y servicios de categoría media. 68 controles aplicables.',
    controls: 68,
  },
  {
    level: 'ALTO',
    description: 'Sistemas con información y servicios de categoría alta. 73 controles aplicables.',
    controls: 73,
  },
];

export function LevelSelector({ onSelectLevel }: LevelSelectorProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Auditoría ENS</h1>
        <p style={styles.subtitle}>
          Esquema Nacional de Seguridad — Checklist de auditoría
        </p>
        <p style={styles.description}>
          Selecciona el nivel de seguridad de tu sistema para comenzar la evaluación
          de los controles del Anexo II (RD 311/2022).
        </p>
      </div>

      <div style={styles.cardsContainer}>
        {levels.map(({ level, description, controls }) => (
          <button
            key={level}
            type="button"
            style={styles.card}
            onClick={() => onSelectLevel(level)}
            aria-label={`Seleccionar nivel ${level}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={styles.levelBadge}>{level}</span>
            <span style={styles.controlCount}>{controls} controles</span>
            <span style={styles.cardDescription}>{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px 20px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    maxWidth: '600px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 600,
    color: 'var(--text-h)',
    margin: '0 0 12px',
    letterSpacing: '-1.2px',
  },
  subtitle: {
    fontSize: '18px',
    color: 'var(--text)',
    margin: '0 0 16px',
  },
  description: {
    fontSize: '16px',
    color: 'var(--text)',
    margin: 0,
    lineHeight: '1.5',
  },
  cardsContainer: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '900px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    background: 'var(--bg)',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '250px',
    textAlign: 'center',
    fontFamily: 'inherit',
    boxShadow: 'none',
  },
  levelBadge: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.5px',
  },
  controlCount: {
    fontSize: '14px',
    color: 'var(--text)',
    background: 'var(--accent-bg)',
    padding: '4px 12px',
    borderRadius: '16px',
  },
  cardDescription: {
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: '1.5',
  },
};

export default LevelSelector;
