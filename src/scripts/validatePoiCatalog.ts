import { collectVerifiedPoiRows, istanbulPoiRows } from '../lib/poiExport.ts';
import { isInIstanbulBbox, isPlaceCategory, isValidLatLng } from '../lib/poiIdentity.ts';

const CATEGORY_BLEED: Array<{ category: string; pattern: RegExp; unless: RegExp; label: string }> = [
  { category: 'pharmacies', pattern: /hastane|hospital|hotel|fırın|bakery|sigorta|insurance/i, unless: /eczane|pharmacy|صيدل/i, label: 'pharmacy contamination' },
  { category: 'hospitals', pattern: /eczane|pharmacy|avm|mall|otel|hotel|bakery/i, unless: /hastane|hospital|acil|طوارئ|مستشفى/i, label: 'hospital contamination' },
  { category: 'fuel', pattern: /restaurant|restoran|bakery|fırın|hastane/i, unless: /opet|shell|bp|po\b|aytemiz|petrol|燃料|وقود/i, label: 'fuel contamination' },
  { category: 'airports', pattern: /avm|mall|otel|hotel|eczane/i, unless: /airport|havaalani|havalimanı|مطار/i, label: 'airport contamination' },
  { category: 'bakeries', pattern: /hastane|hospital|eczane|insurance|sigorta/i, unless: /fırın|bakery|migros|bim|a101|sok|şok|مخبز|سوبر/i, label: 'bakery contamination' },
];

function report() {
  const all = collectVerifiedPoiRows();
  const istanbul = istanbulPoiRows();
  const byCategory: Record<string, number> = {};
  const issues: string[] = [];
  const seenKey = new Set<string>();
  const seenCoord = new Map<string, string>();

  for (const row of all) {
    byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    if (!row.name?.trim()) issues.push(`Missing name: ${row.identity_key}`);
    if (!isPlaceCategory(row.category)) issues.push(`Invalid category ${row.category}: ${row.name}`);
    if (!isValidLatLng(row.latitude, row.longitude)) issues.push(`Invalid coordinates: ${row.name}`);
    if (!row.city) issues.push(`Missing city: ${row.name}`);
    if (!row.country_code) issues.push(`Missing country: ${row.name}`);
    if (seenKey.has(row.identity_key)) issues.push(`Duplicate identity: ${row.identity_key}`);
    seenKey.add(row.identity_key);
    const coordKey = `${row.category}:${row.latitude.toFixed(5)}:${row.longitude.toFixed(5)}`;
    const prev = seenCoord.get(coordKey);
    if (prev) issues.push(`Duplicate coordinates (${coordKey}): ${prev} / ${row.name}`);
    seenCoord.set(coordKey, row.name);
    if (row.phone && !/^[+\d][\d\s().-]{5,}$/.test(row.phone) && !/^(112|155|999)$/.test(row.phone)) {
      issues.push(`Invalid phone ${row.phone}: ${row.name}`);
    }
    if (row.category === 'pharmacies' && row.is_24_7 && !/24\s*\/\s*7/i.test(row.opening_hours || '')) {
      issues.push(`Suspicious 24/7 pharmacy flag: ${row.name}`);
    }
    if (row.category === 'hospitals' && row.is_emergency && !/طوارئ|\bacil\b|\bemergency\b/i.test(`${row.name} ${row.local_name}`)) {
      issues.push(`Suspicious emergency flag: ${row.name}`);
    }
    const hay = `${row.name} ${row.local_name || ''} ${row.address || ''}`;
    for (const rule of CATEGORY_BLEED) {
      if (row.category !== rule.category) continue;
      if (rule.pattern.test(hay) && !rule.unless.test(hay)) {
        issues.push(`${rule.label}: ${row.name}`);
      }
    }
  }

  const istanbulOutside = istanbul.filter((row) => row.category !== 'airports' && !isInIstanbulBbox(row.latitude, row.longitude));
  for (const row of istanbulOutside) issues.push(`Istanbul record outside bbox: ${row.name} (${row.latitude}, ${row.longitude})`);

  const lines = [
    `Total POIs: ${all.length}`,
    `Istanbul POIs: ${istanbul.length}`,
    '',
    ...Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0])).map(([key, n]) => `${key}: ${n}`),
    '',
    `Invalid coordinates: ${issues.filter((item) => item.startsWith('Invalid coordinates')).length}`,
    `Duplicate records: ${issues.filter((item) => item.startsWith('Duplicate')).length}`,
    `Missing categories: ${issues.filter((item) => item.startsWith('Invalid category')).length}`,
    `Records outside Istanbul: ${istanbulOutside.length}`,
    `Category conflicts: ${issues.filter((item) => item.includes('contamination')).length}`,
    '',
    issues.length ? 'Issues:' : 'No catalog issues detected in the verified export.',
    ...issues.slice(0, 80),
    issues.length > 80 ? `… ${issues.length - 80} more` : '',
  ].filter((line, i, arr) => line !== '' || arr[i - 1] !== '');

  console.log(lines.join('\n'));
  if (issues.length) process.exitCode = 1;
}

report();
