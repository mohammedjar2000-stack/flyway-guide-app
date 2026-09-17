import { useEffect, useState, useMemo } from 'react';
import { Search, X, Plane, Clock, FileCheck, Banknote, Camera, Lightbulb, MapPin, Star, ExternalLink, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Country } from '@/types';
import { visaCategoryLabels, filterOptions, FLYWAY_URL } from '@/types';

const badgeColors: Record<string, string> = {
  free: 'bg-emerald-500/90',
  arrival: 'bg-brand-400 text-neutral-950',
  required: 'bg-orange-600/90',
  evisa: 'bg-violet-600/90',
};

export default function VisasPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selected, setSelected] = useState<Country | null>(null);

  useEffect(() => {
    supabase.from('countries').select('*').order('created_at').then(({ data }) => {
      setCountries(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchesSearch = !search || c.name.includes(search) || c.name_en.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'all' || c.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [countries, search, activeFilter]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">دليل التأشيرات والفيزا</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm">ابحث عن دولتك لمعرفة شروط السفر، نوع الفيزا، مدة الإقامة، وصلاحية الجواز</p>
      </div>

      <div className="max-w-[600px] mx-auto relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400/60" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث عن دولة... (مثال: تركيا، دبي، ماليزيا)"
          className="w-full pr-12 pl-4 py-4 glass-dark rounded-full text-neutral-900 dark:text-white text-sm outline-none border border-neutral-200 dark:border-brand-700/20 transition-all focus:border-brand-500" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:text-zinc-300/50 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
        {search && filtered.length > 0 && (
          <div className="absolute top-full mt-2 w-full glass-dark rounded-xl border border-brand-700/20 shadow-2xl max-h-[300px] overflow-y-auto z-50 animate-slide-down">
            {filtered.slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => { setSelected(c); setSearch(''); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-600/20 transition-all cursor-pointer text-right">
                <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <div className="text-neutral-900 dark:text-white text-sm font-medium">{c.name}</div>
                  <div className="text-neutral-500 dark:text-zinc-300/50 text-xs">{visaCategoryLabels[c.category]}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {filterOptions.map((opt) => (
          <button key={opt.value} onClick={() => setActiveFilter(opt.value)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border ${
              activeFilter === opt.value
                ? 'bg-brand-400 border-brand-400 text-neutral-950'
                : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[320px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 dark:text-zinc-400">
          <p className="text-lg">لم يتم العثور على دول مطابقة لبحثك</p>
        </div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {filtered.map((c) => (
            <div key={c.id} onClick={() => setSelected(c)}
              className="glass-dark rounded-2xl overflow-hidden border border-brand-700/20 card-hover cursor-pointer group">
              <div className="relative h-[200px] overflow-hidden on-dark">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className={`absolute top-3 right-3 text-white px-4 py-1.5 rounded-full text-xs font-semibold ${badgeColors[c.category]}`}>
                  {visaCategoryLabels[c.category]}
                </span>
                {c.trending && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" fill="currentColor" /> رائج
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl mb-2 text-neutral-900 dark:text-white font-bold">{c.name}</h3>
                <p className="text-[13px] text-neutral-600 dark:text-zinc-300 leading-relaxed mb-4 line-clamp-2">{c.description}</p>
                <div className="flex justify-between text-xs text-neutral-500 dark:text-zinc-400 border-t border-neutral-200 dark:border-white/5 pt-3">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.stay_duration}</span>
                  <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> {c.passport_validity}</span>
                </div>
                {c.visa_price_iqd > 0 && (
                  <div className="mt-3 text-brand-300 font-bold text-sm">
                    {c.visa_price_iqd.toLocaleString('en-US')} د.ع
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="max-w-[600px] w-full max-h-[85vh] overflow-y-auto glass-dark rounded-2xl border border-brand-700/30 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[240px] overflow-hidden rounded-t-2xl on-dark">
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelected(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-red-500/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 right-0 left-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <span className={`inline-block mt-1 text-white px-3 py-1 rounded-full text-xs font-semibold ${badgeColors[selected.category]}`}>
                  {visaCategoryLabels[selected.category]}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-neutral-700 dark:text-zinc-200 text-sm leading-relaxed">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 text-brand-400 mb-1"><Clock className="w-4 h-4" /><span className="text-xs font-medium">مدة الإقامة</span></div>
                  <p className="text-neutral-900 dark:text-white text-sm">{selected.stay_duration}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 text-brand-400 mb-1"><FileCheck className="w-4 h-4" /><span className="text-xs font-medium">صلاحية الجواز</span></div>
                  <p className="text-neutral-900 dark:text-white text-sm">{selected.passport_validity}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-brand-400 font-medium mb-1">كشف حساب بنكي</p>
                    <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selected.bank_statement_required ? 'مطلوب' : 'غير مطلوب'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Camera className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-brand-400 font-medium mb-1">إرشادات الصورة البيومترية</p>
                    <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selected.biometric_photo_guidelines}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-brand-400 font-medium mb-1">قوانين الإقامة</p>
                    <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selected.residency_laws}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-1">نصائح قبل السفر</p>
                    <p className="text-neutral-600 dark:text-zinc-300 text-sm">{selected.tips_before_travel}</p>
                  </div>
                </div>
              </div>
              {selected.visa_price_iqd > 0 && (
                <div className="flex items-center justify-between glass rounded-xl p-4">
                  <span className="text-neutral-600 dark:text-zinc-300 text-sm">سعر التأشيرة (مرجعي)</span>
                  <span className="text-brand-300 font-bold text-lg">{selected.visa_price_iqd.toLocaleString('en-US')} د.ع</span>
                </div>
              )}
              <a href={FLYWAY_URL} target="_blank" rel="noopener noreferrer"
                className="w-full btn-primary py-3.5 rounded-xl text-base font-semibold cursor-pointer flex items-center justify-center gap-2 no-underline">
                <Plane className="w-5 h-5" />
                معالجة التأشيرة عبر Flyway
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
