import { Car, Footprints, Square, X } from 'lucide-react';
import type { RoutePoint, RouteResult, TravelMode } from '@/lib/routing';
import { formatRouteDistance, formatRouteDuration, currentStepIndex, remainingRouteCoords } from '@/lib/routing';

interface LiveNavOverlayProps {
  destination: RoutePoint;
  route: RouteResult | null;
  loading: boolean;
  mode: TravelMode;
  userPosition?: { lat: number; lng: number } | null;
  onStop: () => void;
}

export default function LiveNavOverlay({
  destination,
  route,
  loading,
  mode,
  userPosition,
  onStop,
}: LiveNavOverlayProps) {
  const walking = mode === 'walking';
  const remaining = route && userPosition
    ? remainingRouteCoords(route.coordinates, userPosition.lat, userPosition.lng)
    : route?.coordinates ?? [];
  const stepIdx = route
    ? currentStepIndex(route.steps, remaining.length, route.coordinates.length)
    : 0;
  const nextStep = route?.steps?.[stepIdx] || 'اتبع المسار الأزرق نحو الوجهة';
  const laterSteps = route?.steps?.slice(stepIdx + 1, stepIdx + 4) ?? [];

  return (
    <div className="pointer-events-none absolute inset-0 z-[60]" dir="rtl">
      <div className="pointer-events-auto absolute top-3 inset-x-3 max-w-lg mx-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onStop}
          className="h-11 px-4 rounded-full bg-white text-neutral-950 font-bold text-sm shadow-xl flex items-center gap-2 cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-red-600 text-red-600" />
          إنهاء
        </button>
        <div className="flex-1 min-w-0 rounded-2xl bg-neutral-950/90 border border-brand-400/40 text-white px-4 py-2 shadow-[0_0_20px_rgba(204,255,0,0.18)]">
          <p className="text-lg font-black leading-none">
            {loading ? '...' : route ? formatRouteDuration(route.durationMin) : '--'}
          </p>
          <p className="text-[11px] text-brand-300 mt-1 truncate">
            {route ? formatRouteDistance(route.distanceKm) : ''}
            {' · '}
            {walking ? 'مشي' : 'قيادة'}
            {' · '}
            {destination.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="w-11 h-11 rounded-full bg-neutral-950/90 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          aria-label="إغلاق الملاحة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="pointer-events-auto absolute bottom-3 inset-x-3 max-w-lg mx-auto rounded-3xl bg-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="flex items-stretch">
          <div className={`w-16 shrink-0 flex items-center justify-center ${walking ? 'bg-emerald-500' : 'bg-[#1a73e8]'}`}>
            {walking ? <Footprints className="w-7 h-7 text-white" /> : <Car className="w-7 h-7 text-white" />}
          </div>
          <div className="flex-1 min-w-0 p-4">
            <p className="text-[11px] font-bold text-[#5f6368]">الخطوة التالية</p>
            <p className="text-base font-black text-[#202124] leading-snug mt-0.5">{nextStep}</p>
            {laterSteps[0] && (
              <p className="text-xs text-[#5f6368] mt-1 truncate">ثم {laterSteps[0]}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="w-full h-12 bg-brand-400 text-neutral-950 font-black text-sm cursor-pointer"
        >
          إيقاف الملاحة
        </button>
      </div>
    </div>
  );
}
