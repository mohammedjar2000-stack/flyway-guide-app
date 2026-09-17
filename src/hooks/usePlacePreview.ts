import { useCallback, useEffect, useRef, useState } from 'react';
import type { DirectoryListing } from '@/types';

export type PreviewSource = 'marker' | 'list';

export interface PlacePreview {
  place: DirectoryListing;
  x: number;
  y: number;
  source: PreviewSource;
}

export function usePlacePreview() {
  const [preview, setPreview] = useState<PlacePreview | null>(null);
  const hideTimer = useRef(0);

  const show = useCallback((place: DirectoryListing, x: number, y: number, source: PreviewSource) => {
    window.clearTimeout(hideTimer.current);
    setPreview((prev) => {
      if (prev && prev.place.id === place.id && prev.source === source) return prev;
      return { place, x, y, source };
    });
  }, []);

  const hide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setPreview(null), 70);
  }, []);

  const clear = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setPreview(null);
  }, []);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  return { preview, show, hide, clear };
}
