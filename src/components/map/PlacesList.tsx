import { memo, useState, type MouseEvent } from 'react';
import { Clock, Navigation, Star } from 'lucide-react';
import type { DirectoryListing } from '@/types';
import type { PreviewSource } from '@/hooks/usePlacePreview';
import { parseHours } from '@/lib/hours';
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '@/lib/mapIcons';
import { placeGallery, placeHeroFallback, placeHeroImage, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';
import PlaceImageGallery from '@/components/map/PlaceImageGallery';

interface PlacesListProps {
  items: DirectoryListing[];
  loading?: boolean;
  activeId?: string | null;
  onSelect: (item: DirectoryListing) => void;
  formatDistance?: (item: DirectoryListing) => string | null;
  onPreview?: (place: DirectoryListing, x: number, y: number, source: PreviewSource) => void;
  onPreviewEnd?: () => void;
}

const LIST_CAP = 160;

function listingVisual(item: DirectoryListing) {
  const kind = (item.category_key === 'hotels' || item.category_key === 'restaurants')
    ? resolvePlaceKind(item)
    : null;
  const visualKey = kind === 'resort' ? 'resort' : kind === 'cafe' ? 'cafe' : item.category_key;
  return {
    kind,
    color: CATEGORY_COLORS[visualKey] || '#1a73e8',
    emoji: CATEGORY_EMOJI[visualKey] || '📍',
    label: kind ? placeKindLabel(kind) : item.category_label,
  };
}

const PlaceListRow = memo(function PlaceListRow({
  item,
  active,
  dist,
  onSelect,
  onPreview,
  onPreviewEnd,
}: {
  item: DirectoryListing;
  active: boolean;
  dist: string | null;
  onSelect: (item: DirectoryListing) => void;
  onPreview?: PlacesListProps['onPreview'];
  onPreviewEnd?: () => void;
}) {
  const status = parseHours(item.hours);
  const visual = listingVisual(item);
  const isStay = item.category_key === 'hotels' || item.category_key === 'restaurants';
  const [thumb, setThumb] = useState(() => placeGallery(item)[0] || item.image || placeHeroImage(item));

  const openPreview = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPreview?.(item, r.left, r.top + r.height / 2, 'list');
  };

  const cardClass = `w-full text-right bg-white rounded-2xl border cursor-pointer transition-all duration-150 overflow-hidden ${
    active
      ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/15 shadow-md'
      : 'border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'
  }`;

  const meta = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-slate-900 text-[13px] font-bold leading-snug line-clamp-2">{item.name}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-semibold ${
          !item.hours?.trim()
            ? 'bg-slate-100 text-slate-500'
            : status.isOpen
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
        }`}>
          {status.label}
        </span>
      </div>
      <p className="text-slate-500 text-xs truncate mt-0.5">{visual.label}</p>
      {item.address && <p className="text-slate-400 text-[11px] truncate">{item.address}</p>}
      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
        {item.rating > 0 && (
          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
            <Star className="w-3 h-3" fill="currentColor" />
            {Number(item.rating)}
          </span>
        )}
        {dist && (
          <span className="flex items-center gap-1 text-[#1967d2] font-medium">
            <Navigation className="w-3 h-3" />
            {dist}
          </span>
        )}
        {item.hours && (
          <span className="flex items-center gap-1 text-slate-400 truncate">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.hours}</span>
          </span>
        )}
      </div>
    </>
  );

  if (isStay) {
    return (
      <div
        className={cardClass}
        onMouseEnter={openPreview}
        onMouseLeave={() => onPreviewEnd?.()}
      >
        <div className="relative h-[132px]">
          <PlaceImageGallery place={item} variant="card" className="h-full w-full" />
          <span
            className="absolute top-2 start-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
            style={{ background: visual.color }}
          >
            <span aria-hidden>{visual.emoji}</span>
            {visual.label}
          </span>
        </div>
        <button type="button" onClick={() => onSelect(item)} className="w-full p-2.5 text-right cursor-pointer">
          {meta}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      onMouseEnter={openPreview}
      onMouseLeave={() => onPreviewEnd?.()}
      className={`${cardClass} p-2.5`}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => {
              const fallback = placeHeroImage(item);
              if (thumb !== fallback) {
                setThumb(fallback);
                return;
              }
              setThumb(placeHeroFallback(item.category_key));
            }}
          />
          <span
            className="absolute bottom-1 right-1 w-6 h-6 rounded-full text-[12px] flex items-center justify-center border border-white shadow-sm"
            style={{ background: visual.color }}
            aria-hidden
          >
            {visual.emoji}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          {meta}
        </div>
      </div>
    </button>
  );
});

function PlacesList({
  items,
  loading,
  activeId,
  onSelect,
  formatDistance,
  onPreview,
  onPreviewEnd,
}: PlacesListProps) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[92px] rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        لا توجد نتائج في هذه المنطقة
      </div>
    );
  }

  const visible = items.slice(0, LIST_CAP);
  const extra = items.length - visible.length;

  return (
    <div className="space-y-2">
      {visible.map((item) => (
        <PlaceListRow
          key={item.id}
          item={item}
          active={activeId === item.id}
          dist={formatDistance?.(item) ?? null}
          onSelect={onSelect}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      ))}
      {extra > 0 && (
        <p className="text-center text-[11px] text-slate-400 pt-1 pb-2">
          و {extra} مكاناً إضافياً ظاهر على الخريطة
        </p>
      )}
    </div>
  );
}

export default memo(PlacesList);
