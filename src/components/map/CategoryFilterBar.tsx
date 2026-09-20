import {
  Banknote, Camera, Car, Fuel, Hotel, Landmark, LayoutGrid,
  Moon, Pill, PlaneTakeoff, Scissors, Shield, ShoppingBag, ShoppingCart, Smartphone, Stethoscope, UtensilsCrossed,
} from 'lucide-react';
import { DEFAULT_CATEGORY_KEYS, FILTER_BAR_GROUPS, sameCategoryKeys } from '@/lib/mapConfig';
import { formatPlaceCount, type CategoryCountMap } from '@/hooks/useCategoryCounts';

interface CategoryFilterBarProps {
  selected: string[];
  onChange: (next: string[]) => void;
  counts?: CategoryCountMap;
  total?: number;
  layout?: 'rail' | 'chips' | 'grid';
}

const GROUP_ICON: Record<string, typeof Hotel> = {
  hotels: Hotel,
  restaurants: UtensilsCrossed,
  hospitals: Stethoscope,
  pharmacies: Pill,
  markets: ShoppingBag,
  attractions: Camera,
  exchange: Banknote,
  mosques: Landmark,
  transport: Car,
  embassy: Shield,
  telecom: Smartphone,
  nightlife: Moon,
  salons: Scissors,
  fuel: Fuel,
  bakeries: ShoppingCart,
  airports: PlaneTakeoff,
};

function sameKeys(selected: string[], keys: readonly string[]) {
  return sameCategoryKeys(selected, keys);
}

function CountBadge({ value, compact }: { value: number; compact?: boolean }) {
  return (
    <span className={`${compact ? 'inline-flex' : 'hidden md:inline-flex ms-auto'} shrink-0 min-w-[1.15rem] justify-center tabular-nums text-[10px] font-bold leading-none tracking-tight opacity-70`}>
      {formatPlaceCount(value)}
    </span>
  );
}

export default function CategoryFilterBar({ selected, onChange, counts, total = 0, layout = 'rail' }: CategoryFilterBarProps) {
  const allSelected = sameKeys(selected, DEFAULT_CATEGORY_KEYS);
  const allCount = Math.max(0, total - (counts?.airports ?? 0));
  const chips = layout === 'chips';
  const grid = layout === 'grid';

  const chipClass = grid
    ? 'flex flex-col items-center justify-center gap-1.5 min-h-[5.75rem] rounded-2xl px-2 py-3 text-[12px] font-bold leading-tight cursor-pointer select-none border transition-all duration-150 text-center'
    : chips
      ? 'inline-flex items-center gap-1.5 shrink-0 h-9 px-3 rounded-full text-[12px] font-semibold leading-none cursor-pointer select-none border transition-all duration-150'
      : 'inline-flex items-center gap-2 min-h-10 w-10 md:w-full md:min-h-[2.35rem] px-0 md:px-2.5 rounded-2xl text-[12px] font-semibold leading-tight cursor-pointer select-none border transition-all duration-150 justify-center md:justify-start';
  const idle = grid || chips
    ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-brand-400/50 dark:bg-white/5 dark:text-zinc-200 dark:border-white/10'
    : 'bg-white/95 text-[#3c4043] border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#1a73e8]/40 hover:shadow-sm';
  const active = grid || chips
    ? 'bg-brand-400 text-neutral-950 border-brand-300 shadow-[0_2px_10px_rgba(132,204,22,0.35)]'
    : 'bg-[#e8f0fe] text-[#1967d2] border-[#1a73e8]/35 shadow-[0_1px_3px_rgba(26,115,232,0.2)]';

  const items = (
    <>
      <button
        type="button"
        onClick={() => onChange([...DEFAULT_CATEGORY_KEYS])}
        className={`${chipClass} ${allSelected ? active : idle}`}
        aria-pressed={allSelected}
        title={`الكل — ${formatPlaceCount(allCount)} عنصر`}
      >
        <LayoutGrid className={`${grid ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} strokeWidth={2.1} />
        <span className={grid || chips ? 'inline truncate' : 'hidden md:inline truncate'}>الكل</span>
        <CountBadge value={allCount} compact={chips || grid} />
      </button>
      {FILTER_BAR_GROUPS.map((group) => {
        const on = !allSelected && sameKeys(selected, group.keys);
        const Icon = GROUP_ICON[group.id] || Landmark;
        const label = group.id === 'telecom' ? 'اتصالات و eSIM' : group.label;
        const count = counts?.[group.id] ?? 0;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onChange(on ? [...DEFAULT_CATEGORY_KEYS] : [...group.keys])}
            className={`${chipClass} ${on ? active : idle}`}
            aria-pressed={on}
            title={`${label} — ${formatPlaceCount(count)} عنصر`}
          >
            <Icon className={`${grid ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} strokeWidth={2.1} />
            <span className={grid || chips ? 'inline truncate text-center' : 'hidden md:inline truncate text-right'}>
              {group.id === 'telecom' ? (
                <>اتصالات و<span dir="ltr">eSIM</span></>
              ) : (
                group.label
              )}
            </span>
            <CountBadge value={count} compact={chips || grid} />
          </button>
        );
      })}
    </>
  );

  if (grid) {
    return (
      <div className="pointer-events-auto" dir="rtl">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items}
        </div>
      </div>
    );
  }

  if (chips) {
    return (
      <div className="map-chips-scroll pointer-events-auto w-full overflow-x-auto overscroll-x-contain" dir="rtl">
        <div className="flex items-center gap-1.5 px-0.5 min-w-min">
          {items}
        </div>
      </div>
    );
  }

  return (
    <div className="map-filter-rail pointer-events-auto" dir="rtl">
      <div className="flex flex-col gap-1 p-1.5">
        {items}
      </div>
    </div>
  );
}
