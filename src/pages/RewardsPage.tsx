import { useEffect, useState } from 'react';
import { Star, Gift, Trophy, Percent, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Promo } from '@/types';

const typeConfig: Record<string, { icon: typeof Gift; color: string; label: string }> = {
  deal: { icon: Percent, color: 'from-brand-500 to-royal-800', label: 'عرض خاص' },
  winner: { icon: Trophy, color: 'from-amber-500 to-orange-600', label: 'فائز محظوظ' },
  seasonal: { icon: Gift, color: 'from-emerald-500 to-teal-700', label: 'عرض موسمي' },
  rewards: { icon: Award, color: 'from-violet-500 to-indigo-700', label: 'مكافآت' },
};

export default function RewardsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('promos').select('*').eq('is_active', true).order('created_at').then(({ data }) => {
      setPromos(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">العروض والمكافآت</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm">عروض خاصة، فائزون محظوظون، ومكافآت للمسافرين الدائمين</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[240px] rounded-2xl shimmer-bg animate-shimmer" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {promos.map((p) => {
              const config = typeConfig[p.type] || typeConfig.deal;
              const Icon = config.icon;
              return (
                <div key={p.id} className="glass-dark rounded-2xl overflow-hidden border border-brand-700/20 card-hover group">
                  <div className="relative h-[180px] overflow-hidden on-dark">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className={`absolute top-3 right-3 bg-gradient-to-br ${config.color} text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5`}>
                      <Icon className="w-3.5 h-3.5" /> {config.label}
                    </div>
                    {p.discount_percentage > 0 && (
                      <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-lg font-bold px-4 py-1.5 rounded-xl">
                        {p.discount_percentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-neutral-900 dark:text-white font-bold text-lg mb-2">{p.title}</h3>
                    <p className="text-neutral-600 dark:text-zinc-300 text-sm leading-relaxed mb-3">{p.description}</p>
                    {p.valid_until && (
                      <p className="text-neutral-500 dark:text-zinc-400 text-xs">صالح حتى: {p.valid_until}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-dark rounded-2xl p-8 border border-brand-700/20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-indigo-700 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">برنامج نقاط المكافآت</h2>
            <p className="text-neutral-600 dark:text-zinc-300 text-sm max-w-2xl mx-auto mb-6">
              اجمع نقاطاً مع كل تفاعل وحجز عبر Flyway. استبدل نقاطك بخصومات على رحلاتك القادمة وادخل في سحوبات شهرية لرحلات مجانية!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[800px] mx-auto">
              {[
                { icon: Star, title: 'نقاط لكل حجز', desc: '100 نقطة عن كل حجز تأشيرة أو فندق' },
                { icon: TrendingUp, title: 'نقاط التفاعل', desc: '50 نقطة عن كل مراجعة أو مشاركة' },
                { icon: Trophy, title: 'سحب شهري', desc: 'فرصة للفوز برحلة مجانية كل شهر' },
              ].map((item, i) => (
                <div key={i} className="glass rounded-xl p-5">
                  <div className="w-10 h-10 mx-auto mb-3 bg-brand-600/30 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-brand-300" />
                  </div>
                  <h4 className="text-neutral-900 dark:text-white font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-neutral-600 dark:text-zinc-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
