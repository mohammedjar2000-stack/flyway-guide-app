import { useEffect, useRef, useState } from 'react';

export const PHONE_FRAME_WINDOW_NAME = 'flyway-phone-app';

const SCREEN_W = 393;
const SCREEN_H = 852;
const BEZEL_X = 12;
const BEZEL_TOP = 38;
const BEZEL_BOTTOM = 16;
const DEVICE_W = SCREEN_W + BEZEL_X * 2;
const DEVICE_H = SCREEN_H + BEZEL_TOP + BEZEL_BOTTOM;

export function isDevPhoneFrameHost() {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  if (window.name === PHONE_FRAME_WINDOW_NAME) return false;
  return new URLSearchParams(window.location.search).get('frame') !== '0';
}

export default function DevPhoneFrame() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    document.documentElement.classList.add('dev-phone-host');
    document.body.classList.add('dev-phone-host');
    return () => {
      document.documentElement.classList.remove('dev-phone-host');
      document.body.classList.remove('dev-phone-host');
    };
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const pad = 40;
      const next = Math.min(
        (el.clientWidth - pad) / DEVICE_W,
        (el.clientHeight - pad) / DEVICE_H,
        1,
      );
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <div ref={stageRef} className="dev-phone-stage" dir="ltr">
      <div
        className="dev-phone-scale"
        style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}
      >
        <div
          className="dev-phone-device"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <span className="dev-phone-btn dev-phone-btn-silent" />
          <span className="dev-phone-btn dev-phone-btn-vol-up" />
          <span className="dev-phone-btn dev-phone-btn-vol-down" />
          <span className="dev-phone-btn dev-phone-btn-power" />

          <div className="dev-phone-bezel">
            <div className="dev-phone-island" aria-hidden="true">
              <span className="dev-phone-island-camera" />
            </div>
            <iframe
              name={PHONE_FRAME_WINDOW_NAME}
              title="Flyway Guide — معاينة الجوال"
              src={window.location.href}
              className="dev-phone-screen"
              width={SCREEN_W}
              height={SCREEN_H}
              allow="geolocation; clipboard-read; clipboard-write"
            />
            <div className="dev-phone-home" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
