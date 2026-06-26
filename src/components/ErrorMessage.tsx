import './ErrorMessage.css';

export type ErrorVariant = 'inline' | 'toast' | 'critical';

export interface ErrorMessageProps {
  message: string;
  variant?: ErrorVariant;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, variant = 'inline', onDismiss }: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <p role="alert" className="error-message--inline">
        {message}
      </p>
    );
  }

  if (variant === 'toast') {
    return (
      <div role="alert" className="error-message--toast">
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="error-message__dismiss"
            aria-label="Cerrar mensaje de error"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // variant === 'critical'
  return (
    <div role="alertdialog" aria-modal="true" aria-label="Error crítico" className="error-message--critical">
      <div className="error-message__critical-box">
        <h2 className="error-message__critical-title">Error crítico</h2>
        <p className="error-message__critical-text">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="error-message__critical-button"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );
}
