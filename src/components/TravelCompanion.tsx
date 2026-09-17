import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Phone, X, AlertCircle, MapPin, Navigation, Flame, Siren } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { WORLD_CURRENCIES, convertViaUsd, currencySearchText } from '@/lib/worldCurrencies';
import { WORLD_EMERGENCY, emergencySearchText } from '@/lib/worldEmergencyNumbers';
import { IRAQI_MISSIONS, missionsForCountry, type IraqiMission } from '@/lib/iraqiMissions';
import { useUsdRates } from '@/hooks/useUsdRates';

interface TravelCompanionProps {
  expanded: 'currency' | 'emergency' | null;
  onExpand: (next: 'currency' | 'emergency' | null) => void;
  currentCountry?: string;
  onOpenMission?: (mission: IraqiMission) => void;
}

export default function TravelCompanion({ expanded, onExpand, currentCountry, onOpenMission }: TravelCompanionProps) {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('IQD');
  const [toCurrency, setToCurrency] = useState('USD');
  const [selectedIso, setSelectedIso] = useState('TR');
  const [missionQuery, setMissionQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { rates, live } = useUsdRates();

  useEffect(() => {
    if (!currentCountry) return;
    const match = WORLD_EMERGENCY.find(
      (c) => c.nameAr === currentCountry || c.nameEn.toLowerCase() === currentCountry.toLowerCase(),
    );
    if (match) setSelectedIso(match.iso);
  }, [currentCountry]);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      if ((e.target as HTMLElement | null)?.closest?.('#flyway-searchable-menu')) return;
      onExpand(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, onExpand]);

  const amountNum = parseFloat(amount) || 0;
  const converted = convertViaUsd(amountNum, fromCurrency, toCurrency, rates);
  const usdValue = convertViaUsd(amountNum, fromCurrency, 'USD', rates);
  const emergency = WORLD_EMERGENCY.find((c) => c.iso === selectedIso) ?? WORLD_EMERGENCY.find((c) => c.iso === 'TR')!;

  const countryMissions = useMemo(() => missionsForCountry(emergency.nameAr), [emergency.nameAr]);

  const filteredMissions = useMemo(() => {
    const q = missionQuery.trim().toLowerCase();
    const pool = q
      ? IRAQI_MISSIONS.filter((m) =>
          `${m.nameAr} ${m.nameEn} ${m.cityAr} ${m.cityEn} ${m.countryAr} ${m.countryEn}`.toLowerCase().includes(q),
        )
      : countryMissions;
    return pool.slice(0, 12);
  }, [missionQuery, countryMissions]);

  const kindLabel = (kind: IraqiMission['kind']) =>
    kind === 'embassy' ? 'سفارة' : kind === 'consulate' ? 'قنصلية عامة' : 'بعثة دائمة';

  return (
    <div ref={rootRef} className="relative flex items-center gap-0.5">
      {expanded && createPortal(
        <div ref={panelRef} className="companion-panel fixed top-[4.25rem] left-3 right-3 sm:right-auto z-[200] rounded-2xl p-4 border border-neutral-200 dark:border-white/15 bg-white dark:bg-neutral-950 shadow-2xl w-auto sm:w-[400px] max-w-[calc(100vw-1.5rem)] max-h-[min(78vh,640px)] overflow-y-auto animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-900 dark:text-white text-sm font-bold">
              {expanded === 'currency' ? 'محوّل العملات العالمي' : 'طوارئ وسفارات العراق'}
            </h3>
            <button type="button" onClick={() => onExpand(null)} className="w-7 h-7 rounded-full glass flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-zinc-200/60 dark:hover:text-white cursor-pointer transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {expanded === 'currency' && (
            <div className="space-y-3">
              <div>
                <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">المبلغ</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-white/10 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm font-bold outline-none border border-neutral-200 dark:border-white/15 focus:border-cyan-400/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">من</label>
                  <SearchableSelect
                    items={WORLD_CURRENCIES}
                    value={fromCurrency}
                    onChange={setFromCurrency}
                    getId={(c) => c.code}
                    getLabel={(c) => `${c.flag} ${c.code} — ${c.nameAr}`}
                    searchText={currencySearchText}
                    placeholder="ابحث عن عملة..."
                  />
                </div>
                <div>
                  <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">إلى</label>
                  <SearchableSelect
                    items={WORLD_CURRENCIES}
                    value={toCurrency}
                    onChange={setToCurrency}
                    getId={(c) => c.code}
                    getLabel={(c) => `${c.flag} ${c.code} — ${c.nameAr}`}
                    searchText={currencySearchText}
                    placeholder="ابحث عن عملة..."
                  />
                </div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-neutral-500 dark:text-zinc-400 text-xs mb-1">النتيجة مقابل الدولار الأمريكي</p>
                <p className="text-neutral-900 dark:text-white text-xl font-bold" dir="ltr">
                  {converted.toLocaleString('en-US', { maximumFractionDigits: converted < 1 ? 6 : 2 })} {toCurrency}
                </p>
                <p className="text-neutral-500 dark:text-zinc-400 text-xs mt-1" dir="ltr">
                  {amountNum.toLocaleString('en-US')} {fromCurrency} ≈ {usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                </p>
                <p className="text-[11px] text-neutral-400 mt-2">
                  {live ? 'أسعار حية محدثة نسبةً للدولار الأمريكي' : 'أسعار رسمية تقديرية نسبةً للدولار — يتم التحديث تلقائياً عند توفر الشبكة'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFromCurrency(toCurrency);
                  setToCurrency(fromCurrency);
                }}
                className="w-full text-xs py-2 rounded-xl glass text-neutral-600 dark:text-zinc-300 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/10"
              >
                عكس العملتين
              </button>
            </div>
          )}

          {expanded === 'emergency' && (
            <div className="space-y-3">
              <div>
                <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">ابحث عن أي دولة</label>
                <SearchableSelect
                  items={WORLD_EMERGENCY}
                  value={selectedIso}
                  onChange={(iso) => {
                    setSelectedIso(iso);
                    setMissionQuery('');
                  }}
                  getId={(c) => c.iso}
                  getLabel={(c) => `${c.nameAr} — ${c.nameEn}`}
                  searchText={emergencySearchText}
                  placeholder="اكتب اسم الدولة..."
                />
              </div>

              <div className="space-y-2">
                <a href={`tel:${emergency.police}`} className="flex items-center gap-3 rounded-xl p-3 bg-red-50 border border-red-100 hover:bg-red-100 transition-all cursor-pointer no-underline dark:bg-red-500/15 dark:border-red-500/25 dark:hover:bg-red-500/25">
                  <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                    <Siren className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-900 dark:text-white text-sm font-bold">الشرطة</p>
                    <p className="text-red-600 text-sm font-bold font-mono" dir="ltr">{emergency.police}</p>
                  </div>
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                </a>
                <a href={`tel:${emergency.ambulance}`} className="flex items-center gap-3 rounded-xl p-3 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer no-underline dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:hover:bg-emerald-500/25">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-900 dark:text-white text-sm font-bold">الإسعاف</p>
                    <p className="text-emerald-600 text-sm font-bold font-mono" dir="ltr">{emergency.ambulance}</p>
                  </div>
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                </a>
                <a href={`tel:${emergency.fire}`} className="flex items-center gap-3 rounded-xl p-3 bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-all cursor-pointer no-underline dark:bg-orange-500/15 dark:border-orange-500/25 dark:hover:bg-orange-500/25">
                  <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-900 dark:text-white text-sm font-bold">الإطفاء / الدفاع المدني</p>
                    <p className="text-orange-600 text-sm font-bold font-mono" dir="ltr">{emergency.fire}</p>
                  </div>
                  <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                </a>
              </div>
              {emergency.note && (
                <p className="text-[11px] font-medium text-neutral-600 dark:text-zinc-300 px-1">{emergency.note}</p>
              )}

              <div className="pt-1 border-t border-neutral-200/80 dark:border-white/10">
                <p className="text-neutral-900 dark:text-white text-xs font-bold mb-2">البعثات العراقية — اضغط للخريطة</p>
                <input
                  value={missionQuery}
                  onChange={(e) => setMissionQuery(e.target.value)}
                  placeholder="ابحث عن سفارة أو قنصلية في أي دولة..."
                  className="w-full mb-2 bg-neutral-100 dark:bg-white/10 rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none border border-neutral-200 dark:border-white/15"
                />
                <div className="space-y-2">
                  {filteredMissions.length === 0 && (
                    <p className="text-[11px] text-neutral-600 dark:text-zinc-300 text-center py-2">لا توجد بعثة عراقية مطابقة — جرّب اسم دولة أو مدينة أخرى</p>
                  )}
                  {filteredMissions.map((m) => (
                    <div key={m.id} className="rounded-xl p-3 space-y-2 bg-neutral-50 border border-neutral-200 dark:bg-white/5 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => onOpenMission?.(m)}
                        className="w-full text-right cursor-pointer"
                      >
                        <p className="text-neutral-900 dark:text-white text-sm font-bold leading-snug">{m.nameAr}</p>
                        <p className="text-[11px] text-neutral-600 dark:text-zinc-300 mt-0.5">
                          {kindLabel(m.kind)} · {m.cityAr} · {m.countryAr}
                        </p>
                        <p className="text-[11px] text-neutral-800 dark:text-zinc-200 mt-1 flex items-start gap-1">
                          <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-neutral-500" />
                          <span className="leading-snug">{m.address}</span>
                        </p>
                        <p className="text-[11px] font-mono text-neutral-700 dark:text-zinc-300 mt-1" dir="ltr">
                          {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="flex-1 min-w-0 rounded-lg px-2 py-2 text-[11px] font-semibold no-underline text-neutral-900 dark:text-white bg-white border border-neutral-200 dark:bg-white/10 dark:border-white/15 flex items-center justify-center gap-1">
                          <Phone className="w-3 h-3 shrink-0 text-brand-700 dark:text-brand-400" />
                          <span dir="ltr" className="truncate">{m.phone}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onOpenMission?.(m)}
                          className="flex-1 bg-brand-400 text-neutral-950 rounded-lg px-2 py-2 text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1 hover:bg-brand-300"
                        >
                          <Navigation className="w-3 h-3 shrink-0" />
                          الخريطة والتوجيه
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}

      <button
        type="button"
        onClick={() => onExpand(expanded === 'currency' ? null : 'currency')}
        className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
          expanded === 'currency'
            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
            : 'text-neutral-700 hover:text-cyan-600 dark:text-zinc-300 dark:hover:text-cyan-400 hover:bg-black/[0.05] dark:hover:bg-white/10'
        }`}
        title="محوّل العملات"
        aria-label="محوّل العملات"
        aria-pressed={expanded === 'currency'}
      >
        <Wallet className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
      <button
        type="button"
        onClick={() => onExpand(expanded === 'emergency' ? null : 'emergency')}
        className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
          expanded === 'emergency'
            ? 'bg-red-500/15 text-red-500'
            : 'text-neutral-700 hover:text-red-500 dark:text-zinc-300 dark:hover:text-red-400 hover:bg-black/[0.05] dark:hover:bg-white/10'
        }`}
        title="أرقام الطوارئ والسفارات"
        aria-label="أرقام الطوارئ والسفارات"
        aria-pressed={expanded === 'emergency'}
      >
        <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
    </div>
  );
}
