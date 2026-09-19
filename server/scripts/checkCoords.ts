import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isOpenWater, validateCoordinates } from '../coordIntegrity.js';

const samples: Array<[string, number, number, string]> = [
  ['Taksim', 41.03505, 28.98545, 'Cadde 12'],
  ['Besiktas', 41.0425, 29.0072, 'Cadde 12'],
  ['Uskudar', 41.0235, 29.015, 'Cadde 12'],
  ['Kadikoy', 40.9908, 29.0245, 'Cadde 12'],
  ['centroid', 41.0082, 28.9784, ''],
  ['bosphorus', 41.03, 29.011, 'Cadde 12'],
  ['halic', 41.035, 28.955, 'Cadde 12'],
  ['marmara', 40.92, 29.05, 'Cadde 12'],
  ['null', 0, 0, ''],
];

for (const [name, lat, lng, address] of samples) {
  const v = validateCoordinates({ lat, lng, city: 'Istanbul', address });
  console.log(
    name.padEnd(12),
    'ok=' + v.ok,
    'p=' + v.precision,
    'w=' + isOpenWater(lat, lng, 'istanbul'),
    v.reasons.join(',') || '-',
  );
}

try {
  const storePath = resolve(process.cwd(), 'server', 'data', 'places.json');
  const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as {
    places?: Array<{ name: string; category: string; city?: string; latitude: number; longitude: number; address?: string | null }>;
  };
  const places = parsed.places ?? [];
  let invalid = 0;
  for (const place of places) {
    const v = validateCoordinates({
      lat: place.latitude,
      lng: place.longitude,
      city: place.city,
      address: place.address,
    });
    if (!v.ok) {
      invalid += 1;
      if (invalid <= 8) {
        console.log('STORE_FAIL', place.category, place.name, place.latitude, place.longitude, v.reasons.join(','));
      }
    }
  }
  console.log('store', places.length, 'invalid', invalid);
} catch (err) {
  console.log('store scan skipped', err instanceof Error ? err.message : err);
}
