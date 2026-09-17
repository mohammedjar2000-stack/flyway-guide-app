import { useMemo } from 'react';
import { Star } from 'lucide-react';
import type { DirectoryListing } from '@/types';
import { parseHours } from '@/lib/hours';
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '@/lib/mapIcons';
import { placeGallery, resolvePlaceKind } from '@/lib/placeImagery';
import type { PreviewSource } from '@/hooks/usePlacePreview';

interface PlaceHoverCardProps {
  place: DirectoryListing;
  x: number;
  y: number;
  source: PreviewSource;
}

const CARD_W = 276;
const CARD_H = 176;

function clampPosition(x: number, y: number, source: PreviewSource) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = source === 'list' ? x - CARD_W - 14 : x + 16;
  let top = y - 36;
  if (left + CARD_W > vw - 10) left = x - CARD_W - 16;
  if (left < 10) left = 10;
  if (top + CARD_H > vh - 10) top = vh - CARD_H - 10;
  if (top < 10) top = 10;
  return { left, top };
}

export default function PlaceHoverCard({ place, x, y, source }: PlaceHoverCardProps) {
  const pos = useMemo(() => clampPosition(x, y, source), [x, y, source]);
  const status = parseHours(place.hours?.trim() || '');
  const stayKind = (place.category_key === 'hotels' || place.category_key === 'restaurants')
    ? resolvePlaceKind(place)
    : null;
  const visualKey = stayKind === 'resort' ? 'resort' : stayKind === 'cafe' ? 'cafe' : place.category_key;
  const color = CATEGORY_COLORS[visualKey] || '#ccff00';
  const photos = placeGallery(place);
  const thumb = photos[0];
  const hoursKnown = Boolean(place.hours?.trim());

  return (
    <div
      className="place-hover-card pointer-events-none fixed z-[75] w-[276px] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur-md dark:border-white/15 dark:bg-neutral-950/92"
      style={{ left: pos.left, top: pos.top }}
      dir="rtl"
    >
      <div className="relative h-[96px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            const next = photos.find((url) => url && url !== e.currentTarget.src);
            if (next) e.currentTarget.src = next;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {photos.length > 1 && (
          <div className="absolute bottom-2 end-2 flex gap-1">
            {photos.slice(0, 3).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-3 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        )}
        <span
          className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: color }}
        >
          <span aria-hidden>{CATEGORY_EMOJI[visualKey] || '📍'}</span>
          {stayKind === 'resort' ? 'منتجع' : stayKind === 'hotel' ? 'فندق' : place.category_label}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-[13px] font-bold leading-tight text-neutral-900 dark:text-white">{place.name}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              !hoursKnown
                ? 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-zinc-300'
                : status.isOpen
                  ? 'bg-lime-100 text-lime-800 dark:bg-lime-400/20 dark:text-lime-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300'
            }`}
          >
            {status.label}
          </span>
          {place.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-neutral-900 dark:text-brand-300">
              <Star className="h-3 w-3 text-brand-500" fill="currentColor" />
              {Number(place.rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
