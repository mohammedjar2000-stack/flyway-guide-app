import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent } from 'react';
import { List, X } from 'lucide-react';
import { formatPlaceCount } from '@/hooks/useCategoryCounts';

type Snap = 'peek' | 'mid' | 'full';

interface ResultsBottomSheetProps {
  count: number;
  children: ReactNode;
  onDismiss?: () => void;
}

const PEEK = 118;

function snapHeights(viewportH: number) {
  return {
    peek: PEEK,
    mid: Math.round(Math.max(220, viewportH * 0.4)),
    full: Math.round(Math.max(320, viewportH * 0.72)),
  };
}

function nearestSnap(height: number, viewportH: number): Snap {
  const snaps = snapHeights(viewportH);
  const entries = Object.entries(snaps) as [Snap, number][];
  return entries.reduce((best, [key, value]) => (
    Math.abs(value - height) < Math.abs(snaps[best] - height) ? key : best
  ), 'peek' as Snap);
}

export default function ResultsBottomSheet({ count, children, onDismiss }: ResultsBottomSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<Snap>('mid');
  const [dragH, setDragH] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number } | null>(null);

  const viewportH = () => rootRef.current?.parentElement?.clientHeight || window.innerHeight;
  const height = dragH ?? snapHeights(viewportH())[snap];

  const stopMapZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startH: height };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const next = drag.current.startH + (drag.current.startY - event.clientY);
    const { peek, full } = snapHeights(viewportH());
    setDragH(Math.min(full, Math.max(peek, next)));
  };

  const endDrag = useCallback((event?: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const h = dragH ?? snapHeights(viewportH())[snap];
    const next = nearestSnap(h, viewportH());
    drag.current = null;
    setDragH(null);
    setSnap(next);
    if (event) {
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    }
  }, [dragH, snap]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) setSnap('mid');
  }, []);

  return (
    <div
      ref={rootRef}
      className={`on-light results-sheet pointer-events-auto flex flex-col min-h-0 overflow-hidden rounded-t-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_-12px_40px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-neutral-950/95 dark:text-white ${dragH == null ? 'results-sheet-snap' : ''}`}
      data-snap={snap}
      dir="rtl"
      onWheel={stopMapZoom}
      style={{ height }}
    >
      <button
        type="button"
        className="shrink-0 flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
        aria-label="سحب قائمة النتائج"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => setSnap((prev) => (prev === 'peek' ? 'mid' : prev === 'mid' ? 'full' : 'peek'))}
      >
        <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-white/25" />
      </button>
      <div className="relative shrink-0 flex items-center gap-2 h-10 px-4 text-neutral-950 dark:text-white">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-slate-100 text-neutral-700 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="إخفاء القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <List className="w-4 h-4 shrink-0 text-neutral-700 dark:text-zinc-200" />
        <span className="flex-1 text-right text-sm font-bold truncate tabular-nums">
          {formatPlaceCount(count)} مكان
        </span>
      </div>
      <div className={`min-h-0 flex-1 px-3 pb-3 ${snap === 'peek' && dragH == null ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
        {children}
      </div>
    </div>
  );
}
