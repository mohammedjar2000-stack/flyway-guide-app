import { List, X } from 'lucide-react';
import type { ReactNode, WheelEvent } from 'react';
import { formatPlaceCount } from '@/hooks/useCategoryCounts';

interface PlacesDrawerProps {
  count: number;
  children: ReactNode;
  onDismiss?: () => void;
}

export default function PlacesDrawer({ count, children, onDismiss }: PlacesDrawerProps) {
  const stopMapZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="places-drawer pointer-events-auto flex flex-col h-full min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.22)] dark:border-white/15 dark:bg-neutral-950"
      data-expanded="true"
      dir="rtl"
      onWheel={stopMapZoom}
    >
      <div className="relative shrink-0 flex items-center gap-2 h-14 px-4 text-neutral-950 dark:text-white">
        <List className="w-4 h-4 shrink-0 text-neutral-700 dark:text-zinc-200" />
        <span className="flex-1 text-right text-sm font-bold truncate tabular-nums">
          {formatPlaceCount(count)} مكان
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-slate-100 text-neutral-700 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer"
            aria-label="إخفاء القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3">
        {children}
      </div>
    </div>
  );
}
