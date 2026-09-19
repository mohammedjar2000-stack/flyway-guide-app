import { closePool } from '../db.js';
import { ISTANBUL_IMPORT_SPECS, ISTANBUL_SEED } from '../categories.js';
import { requireDatabaseUrl, requireGeoapifyKey } from '../env.js';
import { fetchGeoapifyPlaces } from '../geoapify.js';
import { upsertPlace } from '../placesRepo.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedIstanbul() {
  requireDatabaseUrl();
  requireGeoapifyKey();

  const stats = { fetched: 0, inserted: 0, updated: 0, skipped: 0 };

  for (const spec of ISTANBUL_IMPORT_SPECS) {
    const places = await fetchGeoapifyPlaces(spec, {
      lon: ISTANBUL_SEED.longitude,
      lat: ISTANBUL_SEED.latitude,
      radiusMeters: ISTANBUL_SEED.radiusMeters,
      limit: ISTANBUL_SEED.limitPerCategory,
    });
    stats.fetched += places.length;
    console.log(`${spec.category}: fetched ${places.length} (cap ${ISTANBUL_SEED.limitPerCategory})`);

    for (const place of places) {
      const result = await upsertPlace({
        name: place.name,
        localName: place.localName,
        country: place.country || ISTANBUL_SEED.country,
        countryCode: (place.countryCode || ISTANBUL_SEED.countryCode).slice(0, 2),
        city: ISTANBUL_SEED.city,
        category: spec.category,
        subcategory: spec.subcategory,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        phone: place.phone,
        website: place.website,
        openingHours: place.openingHours,
        source: 'Geoapify',
        sourceId: place.sourceId,
        metadata: {
          labelAr: spec.labelAr,
          geoapifyCategories: place.categories,
          district: place.city,
          raw: place.raw,
        },
      });
      stats[result] += 1;
    }

    await sleep(350);
  }

  console.log('Istanbul seed complete', stats);
}

seedIstanbul()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
