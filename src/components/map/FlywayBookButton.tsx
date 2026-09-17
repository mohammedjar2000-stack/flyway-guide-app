import { ExternalLink } from 'lucide-react';
import { FLYWAY_CTA_LABEL, flywayBookingUrl, flywayProductForCategory, isFlywayBookable } from '@/lib/flywayBooking';

interface FlywayBookButtonProps {
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  lat?: number;
  lng?: number;
  categoryKey?: string;
  compact?: boolean;
}

export default function FlywayBookButton({
  name,
  city,
  country,
  address,
  lat,
  lng,
  categoryKey,
  compact = false,
}: FlywayBookButtonProps) {
  if (!isFlywayBookable(categoryKey)) return null;

  const href = flywayBookingUrl({
    product: flywayProductForCategory(categoryKey),
    name,
    city,
    country,
    address,
    lat,
    lng,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 font-black text-neutral-950 no-underline shadow-[0_8px_24px_rgba(204,255,0,0.28)] transition-colors hover:bg-brand-300 ${
        compact ? 'h-11 text-[13px]' : 'h-12 text-sm'
      }`}
    >
      {FLYWAY_CTA_LABEL}
      <ExternalLink className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </a>
  );
}
