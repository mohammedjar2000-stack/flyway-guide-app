import { useEffect, useMemo, useRef } from 'react';
import type { Marker as LeafletMarker } from 'leaflet';
import { Circle, Marker, useMap } from 'react-leaflet';
import type { UserPosition } from '@/hooks/useGeolocation';
import { makeUserPuckIcon } from '@/lib/mapIcons';
import { MAP_FOCUS_ZOOM, MAP_MAX_ZOOM } from '@/lib/mapConfig';

interface UserPuckProps {
  position: UserPosition;
  follow?: boolean;
  tight?: boolean;
}

export default function UserPuck({ position, follow = false, tight = false }: UserPuckProps) {
  const map = useMap();
  const markerRef = useRef<LeafletMarker | null>(null);
  const icon = useMemo(
    () => makeUserPuckIcon(position.heading),
    [position.heading],
  );

  useEffect(() => {
    if (!follow) return;
    const current = map.getCenter();
    const threshold = tight ? 0.00008 : 0.002;
    const moved =
      Math.abs(current.lat - position.lat) > threshold ||
      Math.abs(current.lng - position.lng) > threshold;
    if (tight) {
        if (moved || map.getZoom() < MAP_FOCUS_ZOOM) {
        map.setView([position.lat, position.lng], Math.min(Math.max(map.getZoom(), MAP_FOCUS_ZOOM), MAP_MAX_ZOOM), { animate: true });
      }
      return;
    }
    if (!moved) return;
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.4 });
  }, [follow, map, position.lat, position.lng, tight]);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker) marker.setIcon(icon);
  }, [icon]);

  const accuracy = Math.min(Math.max(position.accuracy, 18), 160);

  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={accuracy}
        pathOptions={{
          color: '#ccff00',
          weight: 1,
          fillColor: '#ccff00',
          fillOpacity: 0.12,
          opacity: 0.35,
        }}
      />
      <Marker
        ref={markerRef}
        position={[position.lat, position.lng]}
        icon={icon}
        zIndexOffset={1200}
        interactive={false}
      />
    </>
  );
}
