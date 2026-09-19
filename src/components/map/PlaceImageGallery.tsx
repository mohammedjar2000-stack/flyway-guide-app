import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { galleryCaption, placeGallery, resolvePlaceKind } from '@/lib/placeImagery';
import type { DirectoryListing } from '@/types';
import PlaceSafeImage from '@/components/map/PlaceSafeImage';

interface PlaceImageGalleryProps {
  place: DirectoryListing;
  variant?: 'hero' | 'card';
  className?: string;
}

export default function PlaceImageGallery({ place, variant = 'hero', className = '' }: PlaceImageGalleryProps) {
  const photos = placeGallery(place);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const startX = useRef<number | null>(null);
  const swiping = useRef(false);
  const kind = resolvePlaceKind(place);
  const isHero = variant === 'hero';
  const usable = photos
    .map((url, i) => ({ url, i }))
    .filter((item) => !failed.has(item.i));
  const count = Math.max(usable.length, 1);
  const safeIndex = ((index % count) + count) % count;
  const current = usable[safeIndex]?.url || '';

  useEffect(() => {
    setIndex(0);
    setFailed(new Set());
  }, [place.id]);

  const go = (dir: number, e?: MouseEvent | PointerEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (count < 2) return;
    setIndex((i) => (i + dir + count) % count);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    swiping.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    if (Math.abs(e.clientX - startX.current) > 12) swiping.current = true;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    const delta = e.clientX - startX.current;
    startX.current = null;
    if (!swiping.current || Math.abs(delta) < 40 || count < 2) return;
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + (delta < 0 ? 1 : -1) + count) % count);
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 touch-pan-y ${className}`}
      dir="ltr"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startX.current = null;
      }}
    >
      {current ? (
        <img
          src={current}
          alt={`${place.name} — ${galleryCaption(usable[safeIndex]?.i ?? safeIndex, kind, place.category_key)}`}
          className="w-full h-full object-cover pointer-events-none"
          loading={isHero ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => {
            const failedAt = usable[safeIndex]?.i ?? 0;
            setFailed((prev) => {
              const next = new Set(prev);
              next.add(failedAt);
              return next;
            });
            setIndex(0);
          }}
        />
      ) : (
        <PlaceSafeImage
          place={place}
          className="w-full h-full object-cover pointer-events-none"
          alt={place.name}
          loading={isHero ? 'eager' : 'lazy'}
        />
      )}
      {isHero && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
      )}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => go(-1, e)}
            className="absolute top-1/2 -translate-y-1/2 left-2 z-10 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center cursor-pointer hover:bg-white"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => go(1, e)}
            className="absolute top-1/2 -translate-y-1/2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center cursor-pointer hover:bg-white"
            aria-label="الصورة التالية"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
      {count > 1 && (
        <div className={`absolute inset-x-0 z-10 flex justify-center gap-1.5 pointer-events-auto ${isHero ? 'bottom-10' : 'bottom-2'}`}>
          {usable.map((item, i) => (
            <button
              key={`${place.id}-dot-${item.i}`}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full cursor-pointer transition-all ${
                i === safeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
              }`}
              aria-label={galleryCaption(item.i, kind, place.category_key)}
            />
          ))}
        </div>
      )}
      {isHero && (
        <p className="absolute top-3 left-3 z-10 max-w-[70%] text-[11px] font-semibold text-white bg-black/45 rounded-full px-2.5 py-0.5 pointer-events-none">
          {galleryCaption(usable[safeIndex]?.i ?? safeIndex, kind, place.category_key)}
        </p>
      )}
    </div>
  );
}
