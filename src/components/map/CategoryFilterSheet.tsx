import { X } from 'lucide-react';
import { useEffect } from 'react';
import CategoryFilterBar from '@/components/map/CategoryFilterBar';
import type { CategoryCountMap } from '@/hooks/useCategoryCounts';

interface CategoryFilterSheetProps {
  open: boolean;
  selected: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
  counts?: CategoryCountMap;
  total?: number;
}

export default function CategoryFilterSheet({
  open,
  selected,
  onChange,
  onClose,
  counts,
  total = 0,
}: CategoryFilterSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[70] pointer-events-none" dir="rtl">
      <button
        type="button"
        className="absolute inset-0 pointer-events-auto bg-black/45 backdrop-blur-[2px] cursor-pointer"
        aria-label="إغلاق التصنيفات"
        onClick={onClose}
      />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(32rem,calc(100%-2rem))] max-h-[min(82vh,640px)] flex flex-col rounded-t-3xl md:rounded-3xl border border-white/70 bg-white shadow-[0_-16px_50px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-neutral-950">
        <div className="shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
          <span className="mx-auto md:mx-0 w-10 h-1.5 rounded-full bg-slate-300 dark:bg-white/25 md:hidden" />
          <h2 className="hidden md:block flex-1 text-right text-base font-bold text-neutral-950 dark:text-white">التصنيفات</h2>
          <button
            type="button"
            onClick={onClose}
            className="ms-auto w-9 h-9 rounded-full bg-slate-100 text-neutral-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 flex items-center justify-center cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="px-4 pb-2 text-sm font-bold text-neutral-950 dark:text-white md:hidden">التصنيفات والخدمات</p>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-24 md:pb-5">
          <CategoryFilterBar
            layout="grid"
            selected={selected}
            onChange={onChange}
            counts={counts}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}
