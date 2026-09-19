import { useEffect, useMemo, useState } from 'react';
import type { DirectoryListing } from '@/types';
import { placeGallery, placeHeroFallback, placeHeroImage } from '@/lib/placeImagery';

interface PlaceSafeImageProps {
  place: DirectoryListing;
  className?: string;
  alt?: string;
  prefer?: string;
  loading?: 'lazy' | 'eager';
}

export default function PlaceSafeImage({
  place,
  className = '',
  alt,
  prefer,
  loading = 'lazy',
}: PlaceSafeImageProps) {
  const chain = useMemo(() => {
    const urls = [
      prefer,
      ...placeGallery(place),
      placeHeroImage(place),
      placeHeroFallback(place.category_key),
    ].filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url)));
    return Array.from(new Set(urls));
  }, [place, prefer]);

  const [failed, setFailed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFailed(new Set());
  }, [place.id, prefer]);

  const src = chain.find((url) => !failed.has(url));
  if (!src) {
    const rescue = placeHeroFallback(place.category_key, place.place_kind ?? undefined);
    if (rescue && !failed.has(rescue)) {
      return (
        <img
          src={rescue}
          alt={alt ?? place.name}
          className={className}
          loading={loading}
          decoding="async"
          draggable={false}
          onError={() => setFailed((prev) => new Set(prev).add(rescue))}
        />
      );
    }
    return (
      <div
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${placeHeroFallback(place.category_key, place.place_kind ?? undefined)})` }}
        role="img"
        aria-label={alt ?? place.name}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? place.name}
      className={className}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => setFailed((prev) => new Set(prev).add(src))}
    />
  );
}
