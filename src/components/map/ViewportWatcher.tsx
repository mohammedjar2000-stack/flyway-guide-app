import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapBounds } from '@/lib/geo';

interface ViewportWatcherProps {
  onChange: (bounds: MapBounds, zoom: number, center: { lat: number; lng: number }) => void;
}

const DEBOUNCE_MS = 650;
const MIN_DELTA_DEG = 0.035;

export default function ViewportWatcher({ onChange }: ViewportWatcherProps) {
  const map = useMap();
  const lastEmitted = useRef<{ bounds: MapBounds; zoom: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const emit = (force = false) => {
      const b = map.getBounds();
      const next: MapBounds = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
      const zoom = map.getZoom();
      const prev = lastEmitted.current;
      if (!force && prev) {
        const dLat = Math.abs(next.south - prev.bounds.south) + Math.abs(next.north - prev.bounds.north);
        const dLng = Math.abs(next.west - prev.bounds.west) + Math.abs(next.east - prev.bounds.east);
        if (dLat < MIN_DELTA_DEG && dLng < MIN_DELTA_DEG && Math.abs(zoom - prev.zoom) < 0.51) {
          return;
        }
      }
      lastEmitted.current = { bounds: next, zoom };
      const c = map.getCenter();
      onChange(next, zoom, { lat: c.lat, lng: c.lng });
    };

    const schedule = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => emit(false), DEBOUNCE_MS);
    };

    emit(true);
    map.on('moveend', schedule);
    map.on('zoomend', schedule);
    return () => {
      map.off('moveend', schedule);
      map.off('zoomend', schedule);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [map, onChange]);

  return null;
}
