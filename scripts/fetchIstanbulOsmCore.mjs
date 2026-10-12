/**
 * One-shot OSM dump for the local Flyway core catalog.
 * Runtime app never calls Overpass — this file is for maintainers only.
 */
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const BBOX = '40.80,28.50,41.24,29.43';

const QUERIES = {
  markets: 'nwr["shop"~"^(mall|department_store|supermarket)$"]',
  bakeries: 'nwr["shop"="bakery"]',
  cafes: 'nwr["amenity"="cafe"]',
  fuel: 'nwr["amenity"="fuel"]',
  salons: 'nwr["shop"~"^(hairdresser|beauty)$"]',
  telecom: 'nwr["shop"="mobile_phone"]',
  transport: 'nwr["amenity"~"^(car_rental|ferry_terminal|bus_station)$"]',
  metro: 'nwr["station"="subway"]',
  hotels: 'nwr["tourism"="hotel"]["name"]',
};

function centerOf(el) {
  if (el.type === 'node') return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

function nameOf(tags = {}) {
  return String(tags['name:ar'] || tags.name || tags['name:en'] || '').trim();
}

async function post(query) {
  let lastErr = '';
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'FlywayGuide/1.0 (local catalog seed; https://github.com/mohammedjar2000-stack/flyway-guide-app)',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        lastErr = `${url} ${res.status}`;
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = String(err);
    }
  }
  throw new Error(lastErr || 'overpass failed');
}

async function fetchCategory(key, selector, extra = '') {
  const query = `[out:json][timeout:90];(${selector}(${BBOX})${extra};);out center tags;`;
  const json = await post(query);
  const rows = [];
  const seen = new Set();
  for (const el of json.elements || []) {
    const c = centerOf(el);
    const name = nameOf(el.tags);
    if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lng) || name.length < 2) continue;
    const id = `${el.type[0]}-${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      name,
      nameEn: String(el.tags['name:en'] || el.tags.name || name).trim(),
      address: [el.tags['addr:street'], el.tags['addr:housenumber'], el.tags['addr:suburb'], el.tags['addr:district']]
        .filter(Boolean)
        .join(', '),
      lat: Number(c.lat.toFixed(7)),
      lng: Number(c.lng.toFixed(7)),
      phone: String(el.tags.phone || el.tags['contact:phone'] || ''),
      hours: String(el.tags.opening_hours || ''),
      website: String(el.tags.website || el.tags['contact:website'] || ''),
    });
  }
  return rows;
}

const out = {};
for (const [key, selector] of Object.entries(QUERIES)) {
  process.stdout.write(`fetch ${key}... `);
  try {
    const rows = await fetchCategory(key, selector);
    out[key] = rows;
    console.log(rows.length);
  } catch (err) {
    out[key] = [];
    console.log('FAIL', err.message);
  }
}

const fs = await import('node:fs');
const dest = new URL('../src/data/istanbulOsmCore.json', import.meta.url);
fs.writeFileSync(dest, JSON.stringify(out));
console.log('wrote', dest.pathname, 'bytes', fs.statSync(dest).size);
