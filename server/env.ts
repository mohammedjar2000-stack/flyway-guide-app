import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envFiles = [
  resolve(process.cwd(), '.env'),
  resolve(here, '..', '.env'),
];

for (const file of envFiles) {
  if (!existsSync(file)) continue;
  loadEnv({ path: file, override: false });
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const geoapifyKeySource = optional('GEOAPIFY_API_KEY')
  ? 'GEOAPIFY_API_KEY'
  : optional('VITE_GEOAPIFY_API_KEY')
    ? 'VITE_GEOAPIFY_API_KEY'
    : null;

if (!process.env.GEOAPIFY_API_KEY?.trim() && process.env.VITE_GEOAPIFY_API_KEY?.trim()) {
  process.env.GEOAPIFY_API_KEY = process.env.VITE_GEOAPIFY_API_KEY.trim();
}
if (!process.env.GOOGLE_PLACES_API_KEY?.trim() && process.env.VITE_GOOGLE_PLACES_API_KEY?.trim()) {
  process.env.GOOGLE_PLACES_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY.trim();
}

function firstOf(...names: string[]): string | undefined {
  for (const name of names) {
    const value = optional(name);
    if (value) return value;
  }
  return undefined;
}

function requiredFor(name: string, when: boolean, hint: string): string | undefined {
  const value = optional(name);
  if (when && !value) {
    throw new Error(`${name} is required ${hint}`);
  }
  return value;
}

export const env = {
  apiPort: Number(optional('API_PORT') ?? 8787),
  databaseUrl: optional('DATABASE_URL'),
  geoapifyApiKey: firstOf('GEOAPIFY_API_KEY', 'VITE_GEOAPIFY_API_KEY'),
  geoapifyKeySource,
  googlePlacesApiKey: firstOf('GOOGLE_PLACES_API_KEY', 'VITE_GOOGLE_PLACES_API_KEY'),
  rapidApiKey: optional('RAPIDAPI_KEY'),
};

export function requireDatabaseUrl(): string {
  return requiredFor('DATABASE_URL', true, '(PostgreSQL connection string, PostGIS enabled)')!;
}

export function requireGeoapifyKey(): string {
  const key = env.geoapifyApiKey || firstOf('GEOAPIFY_API_KEY', 'VITE_GEOAPIFY_API_KEY');
  if (!key) {
    throw new Error('GEOAPIFY_API_KEY or VITE_GEOAPIFY_API_KEY is required');
  }
  return key;
}
