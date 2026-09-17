import type { DirectoryListing } from '@/types';
import { getVerifiedPlaces } from '@/lib/verifiedPlaces';

export function getFallbackPlaces(options: {
  origin?: { lat: number; lng: number } | null;
  city?: string;
  country?: string;
  categories: string[];
}): DirectoryListing[] {
  return getVerifiedPlaces(options);
}
