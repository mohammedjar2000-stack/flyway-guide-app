import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { hasDatabase } from './db.js';
import { countByCategory, pingDb } from './placesRepo.js';
import { filePlaceCount, fileAllPlaces, fileReplacePlaces } from './fileStore.js';
import { importIstanbulBakeries, importIstanbulExchange, importIstanbulFuel, importIstanbulHospitals, importIstanbulHotels, importIstanbulMarkets, importIstanbulPolice, importIstanbulTelecom, importIstanbulTransport, importOsmCategory } from './osmImport.js';
import { seedBundledIstanbulPharmacies } from './seedPlaces.js';
import { placesRouter } from './routes/places.js';
import { scrubStoredPlaces } from './coordLocks.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(cors({
  origin: [/^http:\/\/(localhost|127\.0\.0\.1):\d+$/],
}));

app.get('/api/health', async (_req, res) => {
  const pg = hasDatabase() ? await pingDb() : false;
  const counts = await countByCategory().catch(() => ({} as Record<string, number>));
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  res.json({
    ok: true,
    database: pg || total > 0,
    store: pg ? 'postgis' : 'local',
    placeCount: pg ? total : filePlaceCount(),
    geoapifyConfigured: Boolean(env.geoapifyApiKey),
  });
});

app.use('/api/places', placesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(env.apiPort, '127.0.0.1', () => {
  console.log(`Flyway GIS API listening on http://127.0.0.1:${env.apiPort}`);
  void bootstrapPoiStore();
});

async function bootstrapPoiStore() {
  try {
    let counts = await countByCategory();
    if ((counts.pharmacies ?? 0) < 50) {
      const bundled = await seedBundledIstanbulPharmacies();
      console.log('Bundled Istanbul pharmacies', bundled);
      counts = await countByCategory();
    }
    const scrubbed = scrubStoredPlaces(fileAllPlaces());
    fileReplacePlaces(scrubbed.kept);
    console.log('Coordinate scrub', { kept: scrubbed.kept.length, removed: scrubbed.removed, locked: scrubbed.locked });
    counts = await countByCategory();
    if ((counts.pharmacies ?? 0) >= 50) {
      console.log(`POI store ready (${counts.pharmacies} pharmacies)`);
    }
    void importOsmCategory({
      category: 'pharmacies',
      lat: 41.0082,
      lng: 28.9784,
      radiusMeters: 25000,
      limit: 200,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
    }).then((result) => {
      console.log('Live pharmacies import', result);
    }).catch((err) => {
      console.warn('Live pharmacies import skipped', err instanceof Error ? err.message : err);
    });
    if ((counts.markets ?? 0) < 200) {
      void importIstanbulMarkets().then((result) => {
        console.log('Live Istanbul markets import', result);
      }).catch((err) => {
        console.warn('Live markets import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.hotels ?? 0) < 150) {
      void importIstanbulHotels().then((result) => {
        console.log('Live Istanbul hotels import', result);
      }).catch((err) => {
        console.warn('Live hotels import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.telecom ?? 0) < 70) {
      void importIstanbulTelecom().then((result) => {
        console.log('Live Istanbul telecom import', result);
      }).catch((err) => {
        console.warn('Live telecom import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.exchange ?? 0) < 200) {
      void importIstanbulExchange().then((result) => {
        console.log('Live Istanbul exchange import', result);
      }).catch((err) => {
        console.warn('Live exchange import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.transport ?? 0) < 80) {
      void importIstanbulTransport().then((result) => {
        console.log('Live Istanbul transport import', result);
      }).catch((err) => {
        console.warn('Live transport import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.hospitals ?? 0) < 50) {
      void importIstanbulHospitals().then((result) => {
        console.log('Live Istanbul hospitals import', result);
      }).catch((err) => {
        console.warn('Live hospitals import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.police ?? 0) < 50) {
      void importIstanbulPolice().then((result) => {
        console.log('Live Istanbul police import', result);
      }).catch((err) => {
        console.warn('Live police import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.fuel ?? 0) < 70) {
      void importIstanbulFuel().then((result) => {
        console.log('Live Istanbul fuel import', result);
      }).catch((err) => {
        console.warn('Live fuel import skipped', err instanceof Error ? err.message : err);
      });
    }
    if ((counts.bakeries ?? 0) < 100) {
      void importIstanbulBakeries().then((result) => {
        console.log('Live Istanbul groceries import', result);
      }).catch((err) => {
        console.warn('Live groceries import skipped', err instanceof Error ? err.message : err);
      });
    }
  } catch (err) {
    console.warn('POI bootstrap failed', err instanceof Error ? err.message : err);
  }
}
