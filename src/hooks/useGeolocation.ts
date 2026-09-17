import { useCallback, useEffect, useRef, useState } from 'react';

export interface UserPosition {
  lat: number;
  lng: number;
  heading: number | null;
  accuracy: number;
  speed: number | null;
}

type GeoStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable' | 'watching';

interface UseGeolocationOptions {
  autoStart?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { autoStart = false } = options;
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stopWatch = useCallback(() => {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    stopWatch();
    setStatus('prompt');
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const heading = pos.coords.heading;
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: heading != null && !Number.isNaN(heading) ? heading : null,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed != null && !Number.isNaN(pos.coords.speed) ? pos.coords.speed : null,
        });
        setStatus('watching');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError('تم رفض إذن الموقع');
        } else {
          setStatus('denied');
          setError('تعذر تحديد موقعك');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1500,
        timeout: 12000,
      },
    );
  }, [stopWatch]);

  const stop = useCallback(() => {
    stopWatch();
    setPosition(null);
    setStatus('idle');
    setError(null);
  }, [stopWatch]);

  useEffect(() => {
    if (autoStart) start();
    return () => stopWatch();
  }, [autoStart, start, stopWatch]);

  return { position, status, error, start, stop };
}
