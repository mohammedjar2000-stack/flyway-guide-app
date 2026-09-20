import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PreviewSource } from '@/hooks/usePlacePreview';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw } from 'lucide-react';
import type { DirectoryListing } from '@/types';
import type { MapBounds } from '@/lib/geo';
import type { UserPosition } from '@/hooks/useGeolocation';
import MapMarker from '@/components/map/MapMarker';
import MarkerClusterGroup from '@/components/map/MarkerClusterGroup';
import UserPuck from '@/components/map/UserPuck';
import ViewportWatcher from '@/components/map/ViewportWatcher';
import { makeDestIcon, makeOriginIcon } from '@/lib/mapIcons';
import { MAP_FOCUS_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@/lib/mapConfig';
import { remainingRouteCoords, type RoutePoint } from '@/lib/routing';

interface RouteData {
  coordinates: [number, number][];
}

function MapRecenter({
  lat,
  lng,
  zoom,
  token,
  skipFollowUpdates,
}: {
  lat: number;
  lng: number;
  zoom: number;
  token: number;
  skipFollowUpdates?: boolean;
}) {
  const map = useMap();
  const lastToken = useRef(token);
  useEffect(() => {
    if (token === 0) return;
    const tokenChanged = lastToken.current !== token;
    lastToken.current = token;
    if (skipFollowUpdates && !tokenChanged) return;
    const current = map.getCenter();
    const z = map.getZoom();
    if (Math.abs(current.lat - lat) < 0.0008 && Math.abs(current.lng - lng) < 0.0008 && Math.abs(z - zoom) < 0.4) {
      return;
    }
    map.setView([lat, lng], Math.min(Math.max(zoom, MAP_MIN_ZOOM), MAP_MAX_ZOOM), { animate: false });
  }, [token, lat, lng, zoom, map, skipFollowUpdates]);
  return null;
}

function MapFitListings({
  listings,
  enabled,
  token,
}: {
  listings: DirectoryListing[];
  enabled: boolean;
  token: string;
}) {
  const map = useMap();
  const fitted = useRef('');
  useEffect(() => {
    if (!enabled) {
      fitted.current = '';
      return;
    }
    if (fitted.current === token) return;
    const featured = listings.filter((item) => item.is_featured);
    const seed = (featured.length >= 8 ? featured : listings).slice(0, 60);
    if (seed.length < 2) return;
    fitted.current = token;
    const bounds = L.latLngBounds(seed.map((item) => [item.lat, item.lng] as [number, number]));
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, {
      paddingTopLeft: [48, 88],
      paddingBottomRight: [380, 48],
      maxZoom: 13,
      animate: false,
    });
  }, [enabled, token, listings, map]);
  return null;
}

function MapFocusOnItem({ item }: { item: DirectoryListing | null }) {
  const map = useMap();
  const lastId = useRef<string | null>(null);
  useEffect(() => {
    if (!item) {
      lastId.current = null;
      return;
    }
    if (lastId.current === item.id) return;
    lastId.current = item.id;
    const currentZoom = map.getZoom();
    const nextZoom = Math.min(Math.max(currentZoom, MAP_FOCUS_ZOOM), MAP_MAX_ZOOM);
    if (currentZoom >= MAP_FOCUS_ZOOM) {
      map.panTo([item.lat, item.lng], { animate: true });
      return;
    }
    map.setView([item.lat, item.lng], nextZoom, { animate: true });
  }, [item, map]);
  return null;
}

function MapFitBounds({
  route,
  panelOpen,
  enabled,
}: {
  route: [number, number][] | null;
  panelOpen?: boolean;
  enabled?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !route || route.length < 2) return;
    map.fitBounds(L.latLngBounds(route), {
      paddingTopLeft: [48, panelOpen ? 96 : 80],
      paddingBottomRight: [panelOpen ? 420 : 48, 48],
      maxZoom: MAP_FOCUS_ZOOM,
    });
  }, [route, map, panelOpen, enabled]);
  return null;
}

function MapFocusOnDest({
  point,
  enabled,
}: {
  point: { lat: number; lng: number } | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !point) return;
    map.setView([point.lat, point.lng], Math.min(Math.max(map.getZoom(), MAP_FOCUS_ZOOM), MAP_MAX_ZOOM), { animate: true });
  }, [enabled, point?.lat, point?.lng, map]);
  return null;
}

function MapClickCatcher({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled || !onClick) return;
      const target = e.originalEvent?.target as HTMLElement | undefined;
      if (target?.closest?.('.leaflet-marker-icon, .leaflet-marker-shadow, .marker-cluster, .waze-puck')) return;
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DragDisablesFollow({ onDragStart }: { onDragStart: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('dragstart', onDragStart);
    return () => {
      map.off('dragstart', onDragStart);
    };
  }, [map, onDragStart]);
  return null;
}

function TileLoadTracker({ onChange }: { onChange: (loading: boolean) => void }) {
  const map = useMap();
  useEffect(() => {
    const end = () => onChange(false);
    map.whenReady(end);
    map.on('load', end);
    const fallback = window.setTimeout(end, 1800);
    return () => {
      map.off('load', end);
      window.clearTimeout(fallback);
    };
  }, [map, onChange]);
  return null;
}

function KeepTilesOnZoom() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => {
      const z = map.getZoom();
      if (z > MAP_MAX_ZOOM) {
        map.setZoom(MAP_MAX_ZOOM, { animate: false });
        return;
      }
      if (z < MAP_MIN_ZOOM) {
        map.setZoom(MAP_MIN_ZOOM, { animate: false });
        return;
      }
      map.invalidateSize({ animate: false, pan: false });
    };
    const boot = window.setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 60);
    map.on('zoomend', refresh);
    map.on('resize', refresh);
    return () => {
      window.clearTimeout(boot);
      map.off('zoomend', refresh);
      map.off('resize', refresh);
    };
  }, [map]);
  return null;
}

function saneRouteLine(coords: [number, number][] | null | undefined): [number, number][] | null {
  if (!coords || coords.length < 2) return null;
  const points = coords.filter(([lat, lng]) => (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180
  ));
  if (points.length < 2) return null;
  return points;
}

export interface MapViewProps {
  center: { lat: number; lng: number; zoom: number };
  flyToken: number;
  listings: DirectoryListing[];
  focusedItem: DirectoryListing | null;
  highlightedId?: string | null;
  userPosition: UserPosition | null;
  followUser: boolean;
  route: RouteData | null;
  dataLoading?: boolean;
  dataError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onViewportChange: (bounds: MapBounds, zoom: number, center: { lat: number; lng: number }) => void;
  onSelect: (item: DirectoryListing) => void;
  onPreview?: (place: DirectoryListing, x: number, y: number, source: PreviewSource) => void;
  onPreviewEnd?: () => void;
  onUserDrag: () => void;
  originPoint?: RoutePoint | null;
  destPoint?: RoutePoint | null;
  pickOnMap?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  directionsOpen?: boolean;
  navigating?: boolean;
  fitListings?: boolean;
  fitListingsToken?: string;
}

function MapView({
  center,
  flyToken,
  listings,
  focusedItem,
  highlightedId = null,
  userPosition,
  followUser,
  route,
  dataLoading,
  dataError,
  errorMessage,
  onRetry,
  onViewportChange,
  onSelect,
  onPreview,
  onPreviewEnd,
  onUserDrag,
  originPoint = null,
  destPoint = null,
  pickOnMap = false,
  onMapClick,
  directionsOpen = false,
  navigating = false,
  fitListings = false,
  fitListingsToken = '',
}: MapViewProps) {
  const originIcon = useMemo(() => makeOriginIcon(), []);
  const destIcon = useMemo(() => makeDestIcon(), []);
  const mapMarkers = useMemo(() => {
    let next = listings;
    if (focusedItem && !next.some((item) => item.id === focusedItem.id)) {
      next = [...next, focusedItem];
    }
    if (highlightedId && !next.some((item) => item.id === highlightedId)) {
      const extra = listings.find((item) => item.id === highlightedId);
      if (extra) next = [...next, extra];
    }
    return next;
  }, [listings, focusedItem, highlightedId]);
  const markerNodes = useMemo(
    () => mapMarkers.map((item) => (
      <MapMarker
        key={item.id}
        place={item}
        active={focusedItem?.id === item.id}
        highlighted={highlightedId === item.id && focusedItem?.id !== item.id}
        onSelect={onSelect}
        onPreview={onPreview}
        onPreviewEnd={onPreviewEnd}
      />
    )),
    [mapMarkers, focusedItem?.id, highlightedId, onSelect, onPreview, onPreviewEnd],
  );
  const routeLine = useMemo(() => {
    const coords = route?.coordinates;
    if (!coords || coords.length < 2) return null;
    const remaining = navigating && userPosition
      ? remainingRouteCoords(coords, userPosition.lat, userPosition.lng)
      : coords;
    return saneRouteLine(remaining);
  }, [route?.coordinates, navigating, userPosition]);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [loadingExpired, setLoadingExpired] = useState(false);
  const handleViewport = useCallback(onViewportChange, [onViewportChange]);
  const showSkeleton = tilesLoading && listings.length === 0;
  const showDataSpinner = Boolean(dataLoading) && listings.length === 0 && !showSkeleton && !loadingExpired;

  useEffect(() => {
    if (!dataLoading) {
      setLoadingExpired(false);
      return;
    }
    const id = window.setTimeout(() => setLoadingExpired(true), 12000);
    return () => window.clearTimeout(id);
  }, [dataLoading]);

  return (
    <div className="relative w-full h-full bg-[#d4dde5]" dir="ltr">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={Math.min(Math.max(center.zoom, MAP_MIN_ZOOM), MAP_MAX_ZOOM)}
        className={`w-full h-full waze-map${pickOnMap && !navigating ? ' pick-origin' : ''}`}
        zoomControl={false}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomSnap={1}
        zoomDelta={1}
        wheelPxPerZoomLevel={120}
        scrollWheelZoom
        attributionControl={false}
        worldCopyJump
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          maxNativeZoom={19}
          keepBuffer={8}
          updateWhenZooming={false}
          updateWhenIdle
        />
        <KeepTilesOnZoom />
        <TileLoadTracker onChange={setTilesLoading} />
        <MapRecenter
          lat={center.lat}
          lng={center.lng}
          zoom={center.zoom}
          token={flyToken}
          skipFollowUpdates={navigating}
        />
        <MapFitListings
          listings={listings}
          enabled={fitListings && !navigating && !focusedItem}
          token={fitListingsToken}
        />
        <MapFocusOnItem item={navigating ? null : focusedItem} />
        <MapFocusOnDest point={destPoint} enabled={!navigating && !route} />
        <MapFitBounds route={route?.coordinates ?? null} panelOpen={directionsOpen} enabled={!navigating && directionsOpen} />
        <ViewportWatcher onChange={handleViewport} />
        <DragDisablesFollow onDragStart={onUserDrag} />
        <MapClickCatcher enabled={pickOnMap && Boolean(onMapClick) && !navigating} onClick={onMapClick} />

        {userPosition && <UserPuck position={userPosition} follow={followUser} tight={navigating} />}

        {originPoint && originPoint.source !== 'gps' && (
          <Marker position={[originPoint.lat, originPoint.lng]} icon={originIcon} zIndexOffset={1400} interactive={false} />
        )}
        {destPoint && (
          <Marker position={[destPoint.lat, destPoint.lng]} icon={destIcon} zIndexOffset={1410} interactive={false} />
        )}

        {routeLine && routeLine.length > 1 && (navigating || directionsOpen) && (
          <>
            <Polyline positions={routeLine} pathOptions={{ color: '#000000', weight: 16, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={routeLine} pathOptions={{ color: '#ccff00', weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={routeLine} pathOptions={{ color: '#111111', weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          </>
        )}
        {(!routeLine || routeLine.length < 2) && originPoint && destPoint && (navigating || directionsOpen) && (
          <>
            <Polyline
              positions={[[originPoint.lat, originPoint.lng], [destPoint.lat, destPoint.lng]]}
              pathOptions={{ color: '#000000', weight: 10, opacity: 0.85, dashArray: '10 8', lineCap: 'round' }}
            />
            <Polyline
              positions={[[originPoint.lat, originPoint.lng], [destPoint.lat, destPoint.lng]]}
              pathOptions={{ color: '#ccff00', weight: 5, opacity: 1, dashArray: '10 8', lineCap: 'round' }}
            />
          </>
        )}

        {mapMarkers.length > 70 ? (
          <MarkerClusterGroup removeOutsideVisibleBounds={false} chunkedLoading>
            {markerNodes}
          </MarkerClusterGroup>
        ) : (
          markerNodes
        )}
      </MapContainer>

      {showSkeleton && (
        <div className="absolute inset-0 z-[400] pointer-events-none bg-[#dbe4ea]">
          <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-70" />
          <div className="absolute bottom-8 inset-x-0 text-center text-sm text-brand-800/70 font-medium">
            جاري تحميل الخريطة...
          </div>
        </div>
      )}

      {showDataSpinner && (
        <div className="absolute top-1/2 left-1/2 z-[400] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-brand-950/80 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
            جاري تحديث الأماكن...
          </div>
        </div>
      )}

      {dataError && listings.length === 0 && !dataLoading && !showDataSpinner && (
        <div className="absolute inset-x-4 top-1/2 z-[410] -translate-y-1/2 flex justify-center">
          <div className="bg-brand-950/95 text-white rounded-2xl p-5 max-w-sm text-center border border-white/10 shadow-2xl" dir="rtl">
            <p className="font-bold mb-1">تعذر تحميل الأماكن</p>
            <p className="text-zinc-200/70 text-sm mb-4">{errorMessage || 'حدث خطأ في الاتصال بخريطة OpenStreetMap'}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MapView);
