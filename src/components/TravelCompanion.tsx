import { useState, useEffect, useRef } from 'react';
import { Wallet, Phone, X, AlertCircle } from 'lucide-react';

const CURRENCIES = [
  { code: 'IQD', name: 'دينار عراقي', flag: '🇮🇶', rate: 1 },
  { code: 'TRY', name: 'ليرة تركية', flag: '🇹🇷', rate: 0.0345 },
  { code: 'AED', name: 'درهم إماراتي', flag: '🇦🇪', rate: 0.00027 },
  { code: 'SAR', name: 'ريال سعودي', flag: '🇸🇦', rate: 0.00027 },
  { code: 'IRR', name: 'تومان إيراني', flag: '🇮🇷', rate: 0.0167 },
  { code: 'OMR', name: 'ريال عماني', flag: '🇴🇲', rate: 0.00026 },
  { code: 'MYR', name: 'رينغيت ماليزي', flag: '🇲🇾', rate: 0.0033 },
  { code: 'THB', name: 'بات تايلندي', flag: '🇹🇭', rate: 0.027 },
  { code: 'JPY', name: 'ين ياباني', flag: '🇯🇵', rate: 0.098 },
  { code: 'USD', name: 'دولار أمريكي', flag: '🇺🇸', rate: 0.00076 },
  { code: 'EUR', name: 'يورو', flag: '🇪🇺', rate: 0.00070 },
];

const EMERGENCY_NUMBERS: Record<string, { police: string; ambulance: string; embassy: string; label: string }> = {
  'تركيا': { police: '112', ambulance: '112', embassy: '+90-312-440-32-32', label: 'السفارة العراقية في أنقرة' },
  'الإمارات': { police: '999', ambulance: '998', embassy: '+971-2-446-4444', label: 'السفارة العراقية في أبوظبي' },
  'السعودية': { police: '999', ambulance: '997', embassy: '+966-11-488-0888', label: 'السفارة العراقية في الرياض' },
  'إيران': { police: '110', ambulance: '115', embassy: '+98-21-222-90-090', label: 'القنصلية العراقية في طهران' },
  'عُمان': { police: '9999', ambulance: '9999', embassy: '+968-24-698-698', label: 'السفارة العراقية في مسقط' },
  'ماليزيا': { police: '999', ambulance: '999', embassy: '+60-3-2148-6144', label: 'السفارة العراقية في كوالالمبور' },
  'تايلاند': { police: '191', ambulance: '1669', embassy: '+66-2-234-5963', label: 'السفارة العراقية في بانكوك' },
  'اليابان': { police: '110', ambulance: '119', embassy: '+81-3-3445-2000', label: 'السفارة العراقية في طوكيو' },
};

export default function TravelCompanion() {
  const [expanded, setExpanded] = useState<'currency' | 'emergency' | null>(null);
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('IQD');
  const [toCurrency, setToCurrency] = useState('TRY');
  const [selectedCountry, setSelectedCountry] = useState('تركيا');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  const fromRate = CURRENCIES.find((c) => c.code === fromCurrency)?.rate ?? 1;
  const toRate = CURRENCIES.find((c) => c.code === toCurrency)?.rate ?? 1;
  const amountNum = parseFloat(amount) || 0;
  const converted = amountNum > 0 ? (amountNum / fromRate) * toRate : 0;

  const emergency = EMERGENCY_NUMBERS[selectedCountry];

  return (
    <div ref={panelRef} className="fixed bottom-4 left-4 z-[90] flex flex-col gap-2">
      {/* Expanded Panel */}
      {expanded && (
        <div className="glass-dark rounded-2xl p-4 border border-brand-500/30 shadow-2xl w-[320px] max-w-[calc(100vw-2rem)] animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-900 dark:text-white text-sm font-bold">
              {expanded === 'currency' ? 'محوّل العملات' : 'أرقام الطوارئ'}
            </h3>
            <button onClick={() => setExpanded(null)} className="w-7 h-7 rounded-full glass flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-zinc-200/60 dark:hover:text-white cursor-pointer transition-all">
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
                  className="w-full bg-neutral-100 dark:bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm font-bold outline-none border border-neutral-200 dark:border-white/15 focus:border-cyan-400/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">من</label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/15 cursor-pointer appearance-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-brand-900">{c.flag} {c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">إلى</label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/15 cursor-pointer appearance-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-brand-900">{c.flag} {c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-neutral-500 dark:text-zinc-400 text-xs mb-1">النتيجة</p>
                <p className="text-neutral-900 dark:text-white text-xl font-bold">
                  {converted.toLocaleString('en-US', { maximumFractionDigits: 2 })} {toCurrency}
                </p>
                <p className="text-neutral-500 dark:text-zinc-400 text-xs mt-1">
                  {amount} {fromCurrency} = {converted.toLocaleString('en-US', { maximumFractionDigits: 2 })} {toCurrency}
                </p>
              </div>
            </div>
          )}

          {expanded === 'emergency' && (
            <div className="space-y-3">
              <div>
                <label className="text-neutral-500 dark:text-zinc-300 text-xs font-medium mb-1 block">الدولة</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-white/15 cursor-pointer appearance-none"
                >
                  {Object.keys(EMERGENCY_NUMBERS).map((c) => (
                    <option key={c} value={c} className="bg-brand-900">{c}</option>
                  ))}
                </select>
              </div>
              {emergency && (
                <div className="space-y-2">
                  <a href={`tel:${emergency.police}`} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-red-500/20 transition-all cursor-pointer no-underline">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-900 dark:text-white text-sm font-bold">
                        {selectedCountry === 'تركيا' ? 'طوارئ موحد — شرطة وإطفاء' : 'الشرطة'}
                      </p>
                      <p className="text-red-400 text-xs font-mono" dir="ltr">{emergency.police}</p>
                    </div>
                    <Phone className="w-4 h-4 text-zinc-200/40" />
                  </a>
                  <a href={`tel:${emergency.ambulance}`} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-emerald-500/20 transition-all cursor-pointer no-underline">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-900 dark:text-white text-sm font-bold">الإسعاف</p>
                      <p className="text-emerald-400 text-xs font-mono" dir="ltr">{emergency.ambulance}</p>
                    </div>
                    <Phone className="w-4 h-4 text-zinc-200/40" />
                  </a>
                  {selectedCountry === 'تركيا' && (
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400 px-1">
                      تركيا تعتمد الرقم الموحد 112 للشرطة والإسعاف والإطفاء.
                    </p>
                  )}
                  <a href={`tel:${emergency.embassy}`} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-brand-500/20 transition-all cursor-pointer no-underline">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900 dark:text-white text-sm font-bold">السفارة العراقية</p>
                      <p className="text-brand-400 text-xs font-mono truncate" dir="ltr">{emergency.embassy}</p>
                    </div>
                  </a>
                </div>
              )}
              <p className="text-amber-400/70 text-[11px] text-center pt-1">
                اتصل مباشرة — سيتم تحويلك فوراً
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpanded(expanded === 'currency' ? null : 'currency')}
          className={`glass-dark rounded-xl p-3 border cursor-pointer transition-all flex items-center gap-2 ${expanded === 'currency' ? 'border-cyan-400/50 bg-cyan-500/15' : 'border-brand-500/20 hover:border-brand-400/40'}`}
        >
          <Wallet className="w-5 h-5 text-cyan-400" />
          <span className="text-neutral-900 dark:text-white text-xs font-bold hidden sm:block">العملات</span>
        </button>
        <button
          onClick={() => setExpanded(expanded === 'emergency' ? null : 'emergency')}
          className={`glass-dark rounded-xl p-3 border cursor-pointer transition-all flex items-center gap-2 ${expanded === 'emergency' ? 'border-red-400/50 bg-red-500/15' : 'border-brand-500/20 hover:border-red-400/40'}`}
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-neutral-900 dark:text-white text-xs font-bold hidden sm:block">طوارئ</span>
        </button>
      </div>
    </div>
  );
}
