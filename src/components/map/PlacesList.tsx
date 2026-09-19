import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type UIEvent } from 'react';
import { Clock, Navigation, Phone, Star } from 'lucide-react';
import type { DirectoryListing } from '@/types';
import type { PreviewSource } from '@/hooks/usePlacePreview';
import { parseHours } from '@/lib/hours';
import PlaceSafeImage from '@/components/map/PlaceSafeImage';
import { financialKind, financialLabel } from '@/lib/financialKind';
import { CATEGORY_COLORS, CATEGORY_EMOJI, isMallListing } from '@/lib/mapIcons';
import { placeGallery, placeHeroImage, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';
import PlaceImageGallery from '@/components/map/PlaceImageGallery';

interface PlacesListProps {
  items: DirectoryListing[];
  loading?: boolean;
  activeId?: string | null;
  hoveredId?: string | null;
  scrollToId?: string | null;
  onSelect: (item: DirectoryListing) => void;
  formatDistance?: (item: DirectoryListing) => string | null;
  onPreview?: (place: DirectoryListing, x: number, y: number, source: PreviewSource) => void;
  onPreviewEnd?: () => void;
}

function listingVisual(item: DirectoryListing) {
  if (item.category_key === 'markets') {
    const mall = isMallListing(item);
    return {
      kind: null,
      color: CATEGORY_COLORS[mall ? 'mall' : 'market'] || '#8b5cf6',
      emoji: mall ? '🏬' : '🛒',
      label: mall ? 'مركز تسوق' : item.category_label,
    };
  }
  if (item.category_key === 'telecom') {
    return {
      kind: null,
      color: CATEGORY_COLORS.telecom || '#14b8a6',
      emoji: '📶',
      label: 'اتصالات و eSIM',
    };
  }
  if (item.category_key === 'exchange') {
    const kind = financialKind(item);
    return {
      kind: null,
      color: CATEGORY_COLORS[kind] || CATEGORY_COLORS.exchange,
      emoji: CATEGORY_EMOJI[kind] || '💱',
      label: financialLabel(kind),
    };
  }
  if (item.category_key === 'fuel') {
    return {
      kind: null,
      color: CATEGORY_COLORS.fuel,
      emoji: '⛽',
      label: item.category_label || 'وقود',
    };
  }
  if (item.category_key === 'bakeries') {
    return {
      kind: null,
      color: CATEGORY_COLORS.bakeries,
      emoji: '🥐',
      label: item.category_label || 'مخابز وسوبر ماركت',
    };
  }
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
  hovered,
  dist,
  onSelect,
  onPreview,
  onPreviewEnd,
}: {
  item: DirectoryListing;
  active: boolean;
  hovered: boolean;
  dist: string | null;
  onSelect: (item: DirectoryListing) => void;
  onPreview?: PlacesListProps['onPreview'];
  onPreviewEnd?: () => void;
}) {
  const status = parseHours(item.hours);
  const visual = listingVisual(item);
  const isStay = item.category_key === 'hotels' || item.category_key === 'restaurants' || item.category_key === 'transport';
  const thumb = placeGallery(item)[0] || item.image || placeHeroImage(item);

  const openPreview = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPreview?.(item, r.left, r.top + r.height / 2, 'list');
  };

  const cardClass = `place-list-card w-full text-right bg-white rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${
    active
      ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-lg -translate-y-0.5'
      : hovered
        ? 'border-brand-400 ring-2 ring-brand-400/25 shadow-lg -translate-y-0.5 bg-lime-50/40'
        : 'border-slate-200/90 shadow-sm hover:border-brand-400 hover:shadow-lg hover:-translate-y-0.5'
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
        {item.phone && (
          <span className="flex items-center gap-1 text-slate-500 truncate" dir="ltr">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.phone}</span>
          </span>
        )}
      </div>
    </>
  );

  if (isStay) {
    return (
      <div
        data-place-id={item.id}
        className={cardClass}
        onMouseEnter={openPreview}
        onMouseLeave={() => onPreviewEnd?.()}
        onClick={() => onSelect(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        role="button"
        tabIndex={0}
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
        <button type="button" className="w-full p-2.5 text-right cursor-pointer pointer-events-none">
          {meta}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-place-id={item.id}
      onClick={() => onSelect(item)}
      onMouseEnter={openPreview}
      onMouseLeave={() => onPreviewEnd?.()}
      className={`${cardClass} p-2.5`}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
          <PlaceSafeImage
            place={item}
            prefer={thumb}
            className="w-full h-full object-cover"
            alt=""
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

function rowHeightFor(item: DirectoryListing) {
  const gap = 8;
  if (item.category_key === 'hotels' || item.category_key === 'restaurants' || item.category_key === 'transport') {
    return 196 + gap;
  }
  return 122 + gap;
}

function PlacesList({
  items,
  loading,
  activeId,
  hoveredId,
  scrollToId,
  onSelect,
  formatDistance,
  onPreview,
  onPreviewEnd,
}: PlacesListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 560 });

  const offsets = useMemo(() => {
    const next = new Array<number>(items.length + 1);
    next[0] = 0;
    for (let i = 0; i < items.length; i++) {
      next[i + 1] = next[i] + rowHeightFor(items[i]);
    }
    return next;
  }, [items]);
  const totalHeight = offsets[items.length] || 0;

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    setViewport((prev) => {
      if (Math.abs(prev.top - node.scrollTop) < 24 && prev.height === node.clientHeight) return prev;
      return { top: node.scrollTop, height: node.clientHeight };
    });
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const sync = () => setViewport((prev) => (
      prev.height === node.clientHeight && prev.top === node.scrollTop
        ? prev
        : { top: node.scrollTop, height: node.clientHeight }
    ));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!scrollToId) return;
    const index = items.findIndex((item) => item.id === scrollToId);
    const node = rootRef.current;
    if (index < 0 || !node) return;
    const top = offsets[index];
    const bottom = offsets[index + 1];
    if (top < node.scrollTop) node.scrollTop = top;
    else if (bottom > node.scrollTop + node.clientHeight) node.scrollTop = Math.max(0, bottom - node.clientHeight);
  }, [scrollToId, items, offsets]);

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
        لا توجد نتائج في هذه الفئة
      </div>
    );
  }

  const overscan = 8;
  let start = 0;
  let end = items.length;
  while (start < items.length && offsets[start + 1] < viewport.top) start += 1;
  start = Math.max(0, start - overscan);
  while (end > start && offsets[end - 1] > viewport.top + viewport.height) end -= 1;
  end = Math.min(items.length, end + overscan);
  const padTop = offsets[start] || 0;
  const padBottom = Math.max(0, totalHeight - (offsets[end] || totalHeight));

  return (
    <div ref={rootRef} className="h-full overflow-y-auto overscroll-contain" onScroll={onScroll}>
      <div style={{ height: padTop }} />
      <div>
        {items.slice(start, end).map((item) => (
          <div key={item.id} className="pb-2">
            <PlaceListRow
              item={item}
              active={activeId === item.id}
              hovered={hoveredId === item.id && activeId !== item.id}
              dist={formatDistance?.(item) ?? null}
              onSelect={onSelect}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          </div>
        ))}
      </div>
      <div style={{ height: padBottom }} />
    </div>
  );
}

export default memo(PlacesList);
