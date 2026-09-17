import {
  Banknote, Camera, Car, Fuel, Hotel, Landmark, LayoutGrid,
  Moon, Pill, Scissors, Shield, ShoppingBag, ShoppingCart, Smartphone, Stethoscope, UtensilsCrossed,
} from 'lucide-react';
import { DEFAULT_CATEGORY_KEYS, FILTER_BAR_GROUPS } from '@/lib/mapConfig';

interface CategoryFilterBarProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

const CHIP =
  'inline-flex items-center justify-center gap-1.5 min-h-8 sm:min-h-9 px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium leading-tight cursor-pointer select-none border shadow-[0_1px_2px_rgba(60,64,67,0.18)] transition-colors duration-150';
const CHIP_IDLE =
  'bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#bdc1c6]';
const CHIP_ACTIVE =
  'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc] shadow-[0_1px_2px_rgba(26,115,232,0.18)]';

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
};

function sameKeys(selected: string[], keys: readonly string[]) {
  return selected.length === keys.length && keys.every((key) => selected.includes(key));
}

export default function CategoryFilterBar({ selected, onChange }: CategoryFilterBarProps) {
  const allSelected = sameKeys(selected, DEFAULT_CATEGORY_KEYS);

  return (
    <div className="w-full" dir="rtl">
      <div className="flex items-center gap-1.5 sm:gap-2 p-2 pe-3 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:#dadce0_transparent]">
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_CATEGORY_KEYS])}
          className={`${CHIP} w-auto shrink-0 whitespace-nowrap ${allSelected ? CHIP_ACTIVE : CHIP_IDLE}`}
          aria-pressed={allSelected}
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" strokeWidth={2.1} />
          الكل
        </button>
        {FILTER_BAR_GROUPS.map((group) => {
          const on = !allSelected && sameKeys(selected, group.keys);
          const Icon = GROUP_ICON[group.id] || Landmark;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onChange(on ? [...DEFAULT_CATEGORY_KEYS] : [...group.keys])}
              className={`${CHIP} w-auto shrink-0 whitespace-nowrap ${on ? CHIP_ACTIVE : CHIP_IDLE}`}
              aria-pressed={on}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.1} />
              <span>
                {group.id === 'telecom' ? (
                  <>اتصالات و<span dir="ltr">SIM</span></>
                ) : (
                  group.label
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
