import { useEffect, useState } from 'react';
import { MapPin, Lightbulb, Mountain, Landmark, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscoverIraq } from '@/types';

const categoryConfig: Record<string, { label: string; icon: typeof Mountain }> = {
  heritage: { label: 'مواقع تراثية', icon: Landmark },
  domestic: { label: 'سياحة محلية', icon: Mountain },
};

export default function DiscoverIraqPage() {
  const [items, setItems] = useState<DiscoverIraq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<DiscoverIraq | null>(null);

  useEffect(() => {
    supabase.from('discover_iraq').select('*').order('created_at').then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-400/25">
          <MapPin className="w-8 h-8 text-neutral-950" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">اكتشف العراق</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm max-w-2xl mx-auto">
          مواقع تراثية عريقة، أماكن مقدسة، طبيعة خلابة، ومنتجعات شمالية — دليلك للسياحة في العراق
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border ${
            filter === 'all' ? 'bg-brand-400 border-brand-400 text-neutral-950' : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
          }`}>
          الكل
        </button>
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border ${
              filter === key ? 'bg-brand-400 border-brand-400 text-neutral-950' : 'glass-dark border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
            }`}>
            {cfg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[280px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {filtered.map((item) => {
            const cfg = categoryConfig[item.category] || categoryConfig.heritage;
            const Icon = cfg.icon;
            return (
              <div key={item.id} onClick={() => setSelected(item)}
                className="glass-dark rounded-2xl overflow-hidden border border-brand-700/20 card-hover cursor-pointer group">
                <div className="relative h-[200px] overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="on-dark absolute top-3 right-3 glass px-3 py-1.5 rounded-full text-xs text-zinc-200 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-neutral-600 dark:text-zinc-300 text-sm leading-relaxed line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center gap-1 text-neutral-500 dark:text-zinc-400 text-xs">
                    <MapPin className="w-3.5 h-3.5" /> {item.location}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="max-w-[560px] w-full max-h-[85vh] overflow-y-auto glass-dark rounded-2xl border border-brand-700/30 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[280px] overflow-hidden rounded-t-2xl on-dark">
              <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              <button onClick={() => setSelected(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-red-500/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 right-0 left-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
                <p className="text-zinc-200/70 text-sm flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {selected.location}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-neutral-700 dark:text-zinc-200 text-sm leading-relaxed">{selected.description}</p>
              {selected.tips && (
                <div className="glass rounded-xl p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-1">نصائح للزيارة</p>
                    <p className="text-neutral-700 dark:text-zinc-200 text-sm">{selected.tips}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
