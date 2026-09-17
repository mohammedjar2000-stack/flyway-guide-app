import { useEffect, useState } from 'react';
import { Clock, Copy, MapPin, Navigation, Phone, Star, X } from 'lucide-react';
import type { DirectoryListing } from '@/types';
import { parseHours } from '@/lib/hours';
import FlywayBookButton from '@/components/map/FlywayBookButton';
import PlaceImageGallery from '@/components/map/PlaceImageGallery';
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '@/lib/mapIcons';
import { appleMapsDirUrl, googleMapsSearchUrl, wazeNavUrl } from '@/lib/navLinks';
import { pinQuery, sanitizePin } from '@/lib/placePrecision';
import { placeGallery, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';

interface PlaceBottomSheetProps {
  place: DirectoryListing;
  distanceLabel?: string | null;
  origin?: { lat: number; lng: number } | null;
  onClose: () => void;
  onInternalNavigate?: () => void;
  onStartNavigation?: () => void;
}

export default function PlaceBottomSheet({
  place,
  distanceLabel,
  onClose,
  onInternalNavigate,
  onStartNavigation,
}: PlaceBottomSheetProps) {
  const hoursText = place.hours?.trim() || '';
  const status = parseHours(hoursText);
  const stayKind = (place.category_key === 'hotels' || place.category_key === 'restaurants')
    ? resolvePlaceKind(place)
    : null;
  const visualKey = stayKind === 'resort' ? 'resort' : stayKind === 'cafe' ? 'cafe' : place.category_key;
  const color = CATEGORY_COLORS[visualKey] || '#ccff00';
  const emoji = CATEGORY_EMOJI[visualKey] || '📍';
  const categoryLabel = stayKind ? placeKindLabel(stayKind) : place.category_label;
  const pin = sanitizePin(place.lat, place.lng);
  const lat = pin?.lat ?? Number(place.lat);
  const lng = pin?.lng ?? Number(place.lng);
  const mapsQuery = pinQuery(lat, lng);
  const googleHref = mapsQuery ? googleMapsSearchUrl(lat, lng) : null;
  const wazeHref = mapsQuery ? wazeNavUrl(lat, lng) : null;
  const appleHref = mapsQuery ? appleMapsDirUrl(lat, lng) : null;
  const [copied, setCopied] = useState(false);
  const galleryCount = placeGallery(place).length;

  useEffect(() => {
    setCopied(false);
  }, [place.id, place.category_key]);

  const copyCoords = async () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const phoneHref = place.phone ? `tel:${place.phone.replace(/\s+/g, '')}` : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] pointer-events-none px-3 pb-3 md:px-4 md:pb-4 lg:ps-[372px]">
      <div
        className="pointer-events-auto mx-auto max-w-xl max-h-[82vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] animate-slide-up dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        dir="rtl"
      >
        <div className="relative h-44 md:h-56 overflow-hidden bg-slate-100">
          <PlaceImageGallery place={place} variant="hero" className="h-full w-full" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 start-3 w-9 h-9 rounded-full bg-white text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-md z-20"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 inset-x-4 flex items-end gap-2 z-20 pointer-events-none">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm"
              style={{ background: color }}
            >
              <span aria-hidden>{emoji}</span>
              {categoryLabel}
            </span>
            {galleryCount > 1 && (
              <span className="text-[10px] font-semibold text-white/90 bg-black/35 rounded-full px-2 py-0.5">
                {galleryCount} صور
              </span>
            )}
          </div>
        </div>

        <div className="p-4 pt-3 bg-white dark:bg-neutral-950">
          <h3 className="text-neutral-900 dark:text-white text-xl font-bold leading-tight">{place.name}</h3>
          {place.description ? (
            <p className="mt-1 text-neutral-700 dark:text-zinc-300 text-sm leading-relaxed">{place.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
              !hoursText
                ? 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-zinc-300'
                : status.isOpen
                  ? 'bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
            }`}>
              {status.label}
            </span>
            {place.rating > 0 && (
              <span className="flex items-center gap-1 text-neutral-900 text-[12px] font-bold bg-brand-400 px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5" fill="currentColor" />
                {Number(place.rating).toFixed(1)}
                {place.review_count > 0 ? <span className="text-neutral-700 font-normal">({place.review_count})</span> : null}
              </span>
            )}
            {place.price_level ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-zinc-200">
                {place.price_level}
              </span>
            ) : null}
            {distanceLabel && <span className="text-neutral-800 dark:text-zinc-200 text-[12px] font-semibold">{distanceLabel}</span>}
          </div>

          <div className="mt-4 empty:mt-0 empty:hidden">
            <FlywayBookButton
              name={place.name}
              city={place.city}
              country={place.country_name}
              address={place.address}
              lat={lat}
              lng={lng}
              categoryKey={place.category_key}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {(place.address || place.city) && (
              <div className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 flex items-start gap-2.5 dark:bg-white/5 dark:border-white/10">
                <MapPin className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-neutral-500 font-semibold">العنوان</p>
                  <p className="text-sm text-neutral-900 dark:text-white">{[place.address, place.city, place.country_name].filter(Boolean).join(' — ')}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 flex items-start gap-2.5 dark:bg-white/5 dark:border-white/10">
              <Clock className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-neutral-500 font-semibold">ساعات العمل</p>
                <p className="text-sm text-neutral-900 dark:text-white font-semibold" dir={hoursText ? 'ltr' : 'rtl'}>
                  {hoursText || 'غير متوفر'}
                </p>
                {status.subLabel ? <p className="text-[11px] text-neutral-500 mt-0.5">{status.subLabel}</p> : null}
              </div>
            </div>

            {phoneHref ? (
              <a
                href={phoneHref}
                dir="ltr"
                className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 flex items-center gap-2.5 text-neutral-900 no-underline hover:bg-lime-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                <Phone className="w-4 h-4 text-neutral-900 shrink-0" />
                <div className="text-right flex-1">
                  <p className="text-[10px] text-neutral-500 font-semibold" dir="rtl">رقم التواصل</p>
                  <p className="text-sm font-bold tracking-wide">{place.phone}</p>
                </div>
              </a>
            ) : (
              <div className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 flex items-center gap-2.5 text-neutral-500">
                <Phone className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold">رقم التواصل</p>
                  <p className="text-sm">غير متوفر لهذا المكان</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 flex items-center gap-2.5 dark:bg-white/5 dark:border-white/10">
              <MapPin className="w-4 h-4 text-neutral-900 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-neutral-500 font-semibold">الإحداثيات</p>
                <p className="text-sm text-neutral-900 dark:text-white font-mono" dir="ltr">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { void copyCoords(); }}
                className="shrink-0 h-8 px-2.5 rounded-lg bg-white border border-neutral-200 text-[11px] text-neutral-900 cursor-pointer inline-flex items-center gap-1 hover:bg-neutral-100 dark:bg-neutral-900 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
          </div>

          {place.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {place.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-400 text-neutral-950 border border-brand-500 font-semibold">{tag}</span>
              ))}
            </div>
          )}

          {mapsQuery && googleHref && wazeHref && appleHref && (
            <>
          <p className="mt-4 mb-2 text-[11px] font-bold text-neutral-900 dark:text-white">التنقل إلى الموقع</p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={wazeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl text-xs font-bold flex flex-col items-center justify-center bg-neutral-900 text-white no-underline hover:bg-black"
            >
              Waze
            </a>
            <a
              href={googleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl text-xs font-bold flex flex-col items-center justify-center bg-brand-400 text-neutral-950 no-underline hover:bg-brand-300"
            >
              Google Maps
            </a>
            <a
              href={appleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl text-xs font-bold flex flex-col items-center justify-center bg-neutral-800 text-white no-underline hover:bg-black"
            >
              Apple Maps
            </a>
          </div>
            </>
          )}

          {onStartNavigation && (
            <button
              type="button"
              onClick={onStartNavigation}
              className="w-full mt-2 h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 bg-[#1a73e8] text-white hover:bg-[#174ea6] cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              ابدأ الآن
            </button>
          )}
          {onInternalNavigate && (
            <button
              type="button"
              onClick={onInternalNavigate}
              className="w-full mt-2 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-brand-400 text-neutral-950 hover:bg-brand-300 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              الاتجاهات على الخريطة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
