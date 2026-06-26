import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { controlsService } from '@/services/ControlsService';
import type { ControlENS } from '@/types';
import './GlobalSearch.css';

/**
 * GlobalSearch — Persistent search component for finding ENS controls.
 *
 * Provides a combobox with autocomplete dropdown that searches
 * all controls by control_id and name. Keyboard accessible with
 * arrow keys, Enter for selection, and Escape to close.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const allControls = useMemo(() => controlsService.loadControls(), []);

  // Debounced filtering (150ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const results: ControlENS[] = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const lower = debouncedQuery.toLowerCase();
    return allControls.filter(
      (c) =>
        c.control_id.toLowerCase().includes(lower) ||
        c.name.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [allControls, debouncedQuery]);

  const handleSelect = useCallback(
    (controlId: string) => {
      setQuery('');
      setDebouncedQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
      navigate(`/controls/${controlId}`);
    },
    [navigate]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && query.trim()) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex].control_id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function handleBlur(e: React.FocusEvent) {
    // Close dropdown when focus leaves the component entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && listRef.current?.contains(relatedTarget)) {
      return;
    }
    // Delay so click events on items can fire first
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, 150);
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const activeItem = items[activeIndex];
      if (activeItem && typeof activeItem.scrollIntoView === 'function') {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const listboxId = 'global-search-listbox';

  return (
    <div className="global-search" onBlur={handleBlur}>
      <input
        ref={inputRef}
        type="text"
        className="global-search__input"
        placeholder="Buscar control..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        role="searchbox"
        aria-label="Buscar control"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
      />
      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          className="global-search__dropdown"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {results.length === 0 && debouncedQuery.trim() && (
            <li className="global-search__no-results" role="option" aria-selected={false}>
              Sin resultados
            </li>
          )}
          {results.map((control, index) => (
            <li
              key={control.control_id}
              id={`global-search-option-${index}`}
              className={`global-search__item${
                index === activeIndex ? ' global-search__item--active' : ''
              }`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(control.control_id);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="global-search__item-id">
                {control.control_id}
              </span>
              <span className="global-search__item-name">{control.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GlobalSearch;
