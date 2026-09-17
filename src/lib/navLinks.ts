import { pinQuery } from '@/lib/placePrecision';

export function googleMapsSearchUrl(lat: number, lng: number): string {
  const q = pinQuery(lat, lng);
  if (!q) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function googleMapsDirUrl(
  lat: number,
  lng: number,
  origin?: { lat: number; lng: number } | null,
): string {
  const dest = pinQuery(lat, lng);
  if (!dest) return 'https://www.google.com/maps';
  const from = origin ? pinQuery(origin.lat, origin.lng) : null;
  const originParam = from ? `&origin=${from}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${originParam}&travelmode=driving`;
}

export function appleMapsDirUrl(lat: number, lng: number): string {
  const q = pinQuery(lat, lng);
  if (!q) return 'https://maps.apple.com';
  return `https://maps.apple.com/?daddr=${q}&ll=${q}&dirflg=d`;
}

export function wazeNavUrl(lat: number, lng: number): string {
  const q = pinQuery(lat, lng);
  if (!q) return 'https://waze.com';
  return `https://waze.com/ul?ll=${q}&navigate=yes`;
}
