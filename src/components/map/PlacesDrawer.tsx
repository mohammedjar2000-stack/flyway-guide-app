import { ChevronDown, ChevronUp, List } from 'lucide-react';
import type { ReactNode } from 'react';

interface PlacesDrawerProps {
  expanded: boolean;
  onToggle: () => void;
  count: number;
  children: ReactNode;
}

export default function PlacesDrawer({ expanded, onToggle, count, children }: PlacesDrawerProps) {
  return (
    <div
      className={`places-drawer pointer-events-auto flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.22)] dark:border-white/15 dark:bg-neutral-950 ${
        expanded ? 'max-h-[min(55vh,560px)] lg:max-h-[min(62vh,680px)]' : 'max-h-14'
      }`}
      data-expanded={expanded ? 'true' : 'false'}
      dir="rtl"
    >
      <button
        type="button"
        onClick={onToggle}
        className="relative shrink-0 flex items-center gap-2 h-14 px-4 cursor-pointer text-neutral-950 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5"
        aria-expanded={expanded}
        aria-label={expanded ? 'طي قائمة الأماكن' : 'عرض قائمة الأماكن'}
      >
        <span className="absolute top-1.5 inset-x-0 mx-auto w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-white/30" aria-hidden />
        <List className="w-4 h-4 shrink-0 text-neutral-700 dark:text-zinc-200" />
        <span className="flex-1 text-right text-sm font-bold truncate">
          {count} مكان في نطاق الخريطة
        </span>
        {expanded
          ? <ChevronDown className="w-5 h-5 shrink-0 text-neutral-700 dark:text-zinc-200" />
          : <ChevronUp className="w-5 h-5 shrink-0 text-neutral-700 dark:text-zinc-200" />}
      </button>
      <div
        className={`min-h-0 overflow-y-auto px-3 pb-3 ${expanded ? 'flex-1' : 'hidden'}`}
        aria-hidden={!expanded}
      >
        {children}
      </div>
    </div>
  );
}
