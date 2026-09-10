import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';
import FieldMessage from './FieldMessage';

export default function SearchableSelect({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select…',
  required,
  error,
  help,
  searchPlaceholder = 'Type to search…',
  className = '',
}) {
  const autoId = useId();
  const inputId = `ss-${autoId}`;
  const msgId = `${inputId}-msg`;
  const hasMsg = !!(error || help);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [triggerRect, setTriggerRect] = useState(null);

  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const open = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setTriggerRect(rect);
    setIsOpen(true);
    setQuery('');
    setHighlightedIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  }, []);

  const select = useCallback(
    (val) => {
      onChange?.(val);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  const clear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange?.('');
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
            select(filtered[highlightedIndex].value);
          }
          break;
        case 'Tab':
          close();
          break;
        default:
          break;
      }
    },
    [isOpen, filtered, highlightedIndex, select, open, close]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Compute dropdown position
  const getDropdownStyle = () => {
    if (!triggerRect) return {};
    const top = triggerRect.bottom + 6;
    const left = triggerRect.left;
    const width = triggerRect.width;
    const maxHeight = Math.min(window.innerHeight - top - 20, 320);
    return { position: 'fixed', top, left, width, maxHeight, zIndex: 9999 };
  };

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      style={getDropdownStyle()}
      className="bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-[var(--shadow-elevated)] overflow-hidden animate-[scale-in_0.15s_ease-out_both]"
    >
      <div className="relative p-2 border-b border-[var(--border)]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" aria-hidden="true" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(-1);
          }}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-all placeholder:text-[var(--ink-faint)]"
          onKeyDown={handleKeyDown}
          aria-label={searchPlaceholder}
        />
      </div>
      <ul
        ref={listRef}
        className="overflow-y-auto py-1"
        style={{ maxHeight: 'inherit' }}
        role="listbox"
        aria-label={label || placeholder}
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-sm text-[var(--ink-faint)] text-center font-medium">
            No matches found
          </li>
        ) : (
          filtered.map((option, idx) => {
            const isSelected = String(option.value) === String(value);
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => select(option.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                    : isHighlighted
                    ? 'bg-[var(--surface-soft)] text-[var(--ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          onClick={isOpen ? close : open}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={hasMsg ? msgId : undefined}
          className={`input-base appearance-none pr-20 text-left cursor-pointer flex items-center gap-2 ${
            !selectedOption ? 'text-[var(--ink-faint)]' : ''
          } ${error ? 'input-error' : ''} focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]`}
        >
          <span className="flex-1 truncate text-[16px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {selectedOption && (
            <button
              type="button"
              onClick={clear}
              className="pointer-events-auto p-0.5 rounded-full text-[var(--ink-faint)] hover:text-[var(--error)] hover:bg-[var(--error-soft)] transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[var(--ink-faint)] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </span>
      </div>
      {createPortal(dropdownContent, document.body)}
      <FieldMessage error={error} help={help} id={msgId} />
    </div>
  );
}
