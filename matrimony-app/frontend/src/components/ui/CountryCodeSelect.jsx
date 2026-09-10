import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';

const COUNTRIES = [
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
];

const DEFAULT_COUNTRY = 'CA';

export default function CountryCodeSelect({
  label,
  value,
  onChange,
  required,
  error,
  className = '',
}) {
  const autoId = useId();
  const inputId = `ccs-${autoId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [triggerRect, setTriggerRect] = useState(null);

  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY);
  const filtered = COUNTRIES.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dial.includes(q)
    );
  });

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
    (code) => {
      onChange?.(code);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
            select(filtered[highlightedIndex].code);
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

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const getDropdownStyle = () => {
    if (!triggerRect) return {};
    const top = triggerRect.bottom + 6;
    const left = triggerRect.left;
    const width = Math.max(triggerRect.width, 280);
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
          placeholder="Search country, code, or dial…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-all placeholder:text-[var(--ink-faint)]"
          onKeyDown={handleKeyDown}
          aria-label="Search countries"
        />
      </div>
      <ul
        ref={listRef}
        className="overflow-y-auto py-1"
        style={{ maxHeight: 'inherit' }}
        role="listbox"
        aria-label="Country codes"
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-sm text-[var(--ink-faint)] text-center font-medium">
            No countries found
          </li>
        ) : (
          filtered.map((country, idx) => {
            const isSelected = country.code === value;
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={country.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => select(country.code)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                    : isHighlighted
                    ? 'bg-[var(--surface-soft)] text-[var(--ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                <span className="text-lg leading-none shrink-0">{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className={`text-xs font-mono shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--ink-faint)]'}`}>
                  {country.dial}
                </span>
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
        <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        onClick={isOpen ? close : open}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        className={`input-base appearance-none text-left cursor-pointer flex items-center gap-2 ${
          error ? 'input-error' : ''
        } focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]`}
      >
        <span className="text-lg leading-none shrink-0">{selectedCountry.flag}</span>
        <span className="flex-1 truncate text-[16px]">
          {selectedCountry.name} ({selectedCountry.dial})
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--ink-faint)] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {createPortal(dropdownContent, document.body)}
    </div>
  );
}
