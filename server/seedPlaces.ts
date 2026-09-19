import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { upsertPlace } from './placesRepo.js';

interface SeedPharmacy {
  sourceId: string;
  name: string;
  address?: string | null;
  city?: string;
  lat: number;
  lng: number;
}

export async function seedBundledIstanbulPharmacies(): Promise<{ fetched: number; inserted: number; updated: number }> {
  const file = resolve(process.cwd(), 'server', 'seed', 'istanbulPharmacies.json');
  const rows = JSON.parse(readFileSync(file, 'utf8')) as SeedPharmacy[];
  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    const name = String(row?.name ?? '').trim();
    if (name.length < 3 || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) continue;
    const result = await upsertPlace({
      name,
      localName: null,
      country: 'Turkey',
      countryCode: 'TR',
      city: row.city || 'Istanbul',
      category: 'pharmacies',
      subcategory: 'pharmacy',
      latitude: row.lat,
      longitude: row.lng,
      address: row.address ?? null,
      phone: null,
      website: null,
      openingHours: null,
      source: 'OpenStreetMap',
      sourceId: row.sourceId,
      metadata: { bundled: true },
    });
    if (result === 'inserted') inserted += 1;
    if (result === 'updated') updated += 1;
  }
  return { fetched: rows.length, inserted, updated };
}
