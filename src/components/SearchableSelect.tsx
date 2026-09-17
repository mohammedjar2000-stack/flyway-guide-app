import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

interface SearchableSelectProps<T> {
  items: T[];
  value: string;
  onChange: (id: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  searchText: (item: T) => string;
  placeholder?: string;
  emptyLabel?: string;
}

export default function SearchableSelect<T>({
  items,
  value,
  onChange,
  getId,
  getLabel,
  searchText,
  placeholder = 'ابحث...',
  emptyLabel = 'لا توجد نتائج',
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((item) => getId(item) === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [items, query, searchText]);

  const placeMenu = () => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    placeMenu();
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        const menu = document.getElementById('flyway-searchable-menu');
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white dark:bg-white/10 rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/15 cursor-pointer flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="truncate text-right">{selected ? getLabel(selected) : placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          id="flyway-searchable-menu"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          className="fixed z-[240] rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden dark:bg-neutral-950 dark:border-white/15"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200/80 dark:border-white/10">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white outline-none placeholder:text-neutral-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-neutral-500 text-center">{emptyLabel}</p>
            )}
            {filtered.map((item) => {
              const id = getId(item);
              const active = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2 text-sm cursor-pointer transition-colors ${
                    active
                      ? 'bg-brand-400/20 text-neutral-950 dark:text-white font-bold'
                      : 'text-neutral-700 dark:text-zinc-200 hover:bg-neutral-900/5 dark:hover:bg-white/10'
                  }`}
                >
                  {getLabel(item)}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
