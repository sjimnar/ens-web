import { useState, useEffect, useRef, useCallback } from 'react';
import './CommentField.css';

export interface CommentFieldProps {
  value: string;
  onChange: (comment: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 400;

export function CommentField({
  value,
  onChange,
  placeholder = 'Añadir comentarios u observaciones...',
}: CommentFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFlushedRef = useRef(value);

  // Sync local state when the controlled value changes from outside
  useEffect(() => {
    setLocalValue(value);
    lastFlushedRef.current = value;
  }, [value]);

  const flush = useCallback(
    (text: string) => {
      if (text !== lastFlushedRef.current) {
        lastFlushedRef.current = text;
        onChange(text);
      }
    },
    [onChange]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Reset debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      flush(newValue);
    }, DEBOUNCE_MS);
  }

  function handleBlur() {
    // Flush immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    flush(localValue);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="comment-field">
      <label htmlFor="comment-textarea" className="comment-field__label">
        Comentarios / Observaciones
      </label>
      <textarea
        id="comment-textarea"
        className="comment-field__textarea"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={4}
        aria-label="Comentarios u observaciones del auditor"
      />
      <span className="comment-field__count" aria-live="polite">
        {localValue.length} caracteres
      </span>
    </div>
  );
}
