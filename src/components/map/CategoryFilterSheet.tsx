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
        className="absolute inset-0 pointer-events-auto bg-black/40 backdrop-blur-[1px] cursor-pointer"
        aria-label="إغلاق التصنيفات"
        onClick={onClose}
      />
      <aside className="on-light pointer-events-auto absolute top-0 bottom-0 left-0 w-[min(20.5rem,88vw)] flex flex-col bg-white text-slate-800 shadow-[12px_0_40px_rgba(15,23,42,0.22)] border-r border-slate-200">
        <div className="shrink-0 flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-slate-100">
          <h2 className="flex-1 text-right text-base font-bold text-slate-900">التصنيفات والخدمات</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24">
          <CategoryFilterBar
            layout="grid"
            selected={selected}
            onChange={onChange}
            counts={counts}
            total={total}
          />
        </div>
      </aside>
    </div>
  );
}
