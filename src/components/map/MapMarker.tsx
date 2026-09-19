import { memo } from 'react';
import { Marker } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import type { DirectoryListing } from '@/types';
import type { PreviewSource } from '@/hooks/usePlacePreview';
import { getListingIcon } from '@/lib/mapIcons';
import { sanitizePin } from '@/lib/placePrecision';

interface MapMarkerProps {
  place: DirectoryListing;
  active?: boolean;
  highlighted?: boolean;
  onSelect: (place: DirectoryListing) => void;
  onPreview?: (place: DirectoryListing, x: number, y: number, source: PreviewSource) => void;
  onPreviewEnd?: () => void;
}

function MapMarker({ place, active = false, highlighted = false, onSelect, onPreview, onPreviewEnd }: MapMarkerProps) {
  const pin = sanitizePin(place.lat, place.lng);
  if (!pin) return null;
  const pinned = { ...place, lat: pin.lat, lng: pin.lng };
  return (
    <Marker
      position={[pin.lat, pin.lng]}
      icon={getListingIcon(place, active, highlighted && !active)}
      zIndexOffset={active ? 900 : highlighted ? 700 : 0}
      eventHandlers={{
        click: () => onSelect(pinned),
        mouseover: (e: LeafletMouseEvent) => {
          const oe = e.originalEvent as PointerEvent | MouseEvent | undefined;
          if (oe && 'pointerType' in oe && oe.pointerType === 'touch') return;
          const x = oe && 'clientX' in oe ? oe.clientX : 0;
          const y = oe && 'clientY' in oe ? oe.clientY : 0;
          onPreview?.(pinned, x, y, 'marker');
        },
        mouseout: () => onPreviewEnd?.(),
      }}
    />
  );
}

export default memo(MapMarker);
