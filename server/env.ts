import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env') });

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
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
  geoapifyApiKey: optional('GEOAPIFY_API_KEY') || optional('VITE_GEOAPIFY_API_KEY'),
  googlePlacesApiKey: optional('GOOGLE_PLACES_API_KEY') || optional('VITE_GOOGLE_PLACES_API_KEY'),
  rapidApiKey: optional('RAPIDAPI_KEY'),
};

export function requireDatabaseUrl(): string {
  return requiredFor('DATABASE_URL', true, '(PostgreSQL connection string, PostGIS enabled)')!;
}

export function requireGeoapifyKey(): string {
  return requiredFor(
    'GEOAPIFY_API_KEY',
    !optional('VITE_GEOAPIFY_API_KEY'),
    '(set GEOAPIFY_API_KEY or VITE_GEOAPIFY_API_KEY)',
  ) || optional('VITE_GEOAPIFY_API_KEY')!;
}
