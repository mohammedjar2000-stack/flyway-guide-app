import {
  Banknote, Camera, Car, Fuel, Hotel, Landmark, LayoutGrid,
  Moon, Pill, PlaneTakeoff, Scissors, Shield, ShoppingBag, ShoppingCart, Smartphone, Stethoscope, UtensilsCrossed,
} from 'lucide-react';
import { DEFAULT_CATEGORY_KEYS, FILTER_BAR_GROUPS } from '@/lib/mapConfig';
import { formatPlaceCount, type CategoryCountMap } from '@/hooks/useCategoryCounts';

interface CategoryFilterBarProps {
  selected: string[];
  onChange: (next: string[]) => void;
  counts?: CategoryCountMap;
  total?: number;
}

const CHIP =
  'inline-flex items-center gap-2 min-h-10 w-10 md:w-full md:min-h-[2.35rem] px-0 md:px-2.5 rounded-2xl text-[12px] font-semibold leading-tight cursor-pointer select-none border transition-all duration-150 justify-center md:justify-start';
const CHIP_IDLE =
  'bg-white/95 text-[#3c4043] border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#1a73e8]/40 hover:shadow-sm';
const CHIP_ACTIVE =
  'bg-[#e8f0fe] text-[#1967d2] border-[#1a73e8]/35 shadow-[0_1px_3px_rgba(26,115,232,0.2)]';

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
  return selected.length === keys.length && keys.every((key) => selected.includes(key));
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="hidden md:inline-flex ms-auto shrink-0 min-w-[1.35rem] justify-end tabular-nums text-[10px] font-bold leading-none tracking-tight opacity-70">
      {formatPlaceCount(value)}
    </span>
  );
}

export default function CategoryFilterBar({ selected, onChange, counts, total = 0 }: CategoryFilterBarProps) {
  const allSelected = sameKeys(selected, DEFAULT_CATEGORY_KEYS);
  const allCount = Math.max(0, total - (counts?.airports ?? 0));

  return (
    <div className="map-filter-rail pointer-events-auto" dir="rtl">
      <div className="flex flex-col gap-1 p-1.5">
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_CATEGORY_KEYS])}
          className={`${CHIP} ${allSelected ? CHIP_ACTIVE : CHIP_IDLE}`}
          aria-pressed={allSelected}
          title={`الكل — ${formatPlaceCount(allCount)} عنصر`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={2.1} />
          <span className="hidden md:inline truncate">الكل</span>
          <CountBadge value={allCount} />
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
              className={`${CHIP} ${on ? CHIP_ACTIVE : CHIP_IDLE}`}
              aria-pressed={on}
              title={`${label} — ${formatPlaceCount(count)} عنصر`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2.1} />
              <span className="hidden md:inline truncate text-right">
                {group.id === 'telecom' ? (
                  <>اتصالات و<span dir="ltr">eSIM</span></>
                ) : (
                  group.label
                )}
              </span>
              <CountBadge value={count} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
