import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Unplug,
} from 'lucide-react';
import { isAdminUnlocked, lockAdmin, unlockAdmin } from '@/lib/adminGate';
import {
  probeAllApis,
  probeGisBackend,
  probeGooglePlaces,
  probeLocalStorage,
  probeNominatim,
  probeOverpass,
  probeRapidApi,
  probeSupabasePoi,
  probeTurkeyHotels,
  persistSnapshot,
  readHealthSnapshot,
  type ApiHealthCard,
  type ApiHealthStatus,
} from '@/services/apiHealth';

const PROBE_BY_ID: Record<string, () => Promise<ApiHealthCard>> = {
  'turkey-hotels': () => probeTurkeyHotels(),
  'gis-geoapify': () => probeGisBackend(),
  'google-places': async () => probeGooglePlaces(await probeGisBackend()),
  'rapidapi-booking': async () => probeRapidApi(await probeGisBackend()),
  'supabase-poi': () => probeSupabasePoi(),
  overpass: () => probeOverpass(),
  nominatim: () => probeNominatim(),
  'local-storage': () => probeLocalStorage(),
};

function statusTone(status: ApiHealthStatus) {
  if (status === 'connected') {
    return {
      label: 'متصل',
      dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.65)]',
      chip: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300',
    };
  }
  if (status === 'disconnected') {
    return {
      label: 'غير متصل',
      dot: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.65)]',
      chip: 'bg-red-500/15 text-red-800 border-red-500/30 dark:text-red-300',
    };
  }
  return {
    label: 'خطأ',
    dot: 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)]',
    chip: 'bg-red-600/15 text-red-900 border-red-600/35 dark:text-red-200',
  };
}

function formatTime(value: number | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ar-IQ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function AdminGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const admit = (value: string): boolean => {
    if (!unlockAdmin(value)) return false;
    setError('');
    onUnlocked();
    return true;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!admit(pin)) setError('رمز الدخول غير صحيح.');
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-brand-400 text-neutral-950 flex items-center justify-center mb-5">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">لوحة المراقبة</h1>
        <p className="text-sm text-neutral-600 dark:text-zinc-300 mb-6">
          هذه الصفحة مخصّصة لمراجعة اتصال واجهات البيانات. أدخل رمز المسؤول للمتابعة.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pin}
            autoFocus
            autoComplete="current-password"
            placeholder="رمز الدخول"
            className="w-full rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-black/30 px-4 py-3 text-neutral-900 dark:text-white placeholder:text-neutral-400"
            onChange={(event) => {
              const next = event.target.value;
              setPin(next);
              setError('');
              admit(next);
            }}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-neutral-950 font-semibold py-3 transition-colors"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

function HealthCard({
  card,
  busy,
  expanded,
  onToggle,
  onRefresh,
}: {
  card: ApiHealthCard;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const tone = statusTone(card.status);
  return (
    <article className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${tone.dot}`} />
            <h2 className="font-bold text-neutral-900 dark:text-white truncate">{card.name}</h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-zinc-400">{card.nameEn}</p>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tone.chip}`}>
          {tone.label}
        </span>
      </div>
      <p className="text-sm text-neutral-700 dark:text-zinc-200 leading-relaxed">{card.description}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 px-3 py-2">
          <dt className="text-[11px] text-neutral-500 dark:text-zinc-400">السجلات</dt>
          <dd className="font-bold text-neutral-900 dark:text-white tabular-nums">{card.records.toLocaleString('en-US')}</dd>
        </div>
        <div className="rounded-xl bg-neutral-50 dark:bg-black/30 border border-neutral-200 dark:border-white/10 px-3 py-2">
          <dt className="text-[11px] text-neutral-500 dark:text-zinc-400">زمن الاستجابة</dt>
          <dd className="font-bold text-neutral-900 dark:text-white tabular-nums">
            {card.latencyMs == null ? '—' : `${card.latencyMs} ms`}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed">{card.detail}</p>
      <p className="text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
        <Clock3 className="w-3.5 h-3.5" />
        آخر مزامنة: {formatTime(card.lastSync)}
      </p>
      <div className="flex items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-neutral-950 text-sm font-semibold py-2.5"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          اختبار الاتصال
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-zinc-200"
          aria-label={expanded ? 'إخفاء السجل' : 'عرض السجل'}
        >
          {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <pre dir="ltr" className="max-h-56 overflow-auto rounded-xl bg-neutral-950 text-emerald-200 text-[11px] leading-relaxed p-3 text-left">
          {JSON.stringify(card.log, null, 2)}
        </pre>
      )}
    </article>
  );
}

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked());
  const [cards, setCards] = useState<ApiHealthCard[]>(() => readHealthSnapshot()?.cards || []);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCards(await probeAllApis());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة الواجهات');
    } finally {
      setLoading(false);
      setBusyId(null);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    if (cards.length === 0) void refreshAll();
  }, [unlocked, cards.length, refreshAll]);

  const refreshOne = async (id: string) => {
    const probe = PROBE_BY_ID[id];
    if (!probe) return;
    setBusyId(id);
    try {
      const next = await probe();
      setCards((prev) => {
        const merged = prev.some((card) => card.id === id)
          ? prev.map((card) => (card.id === id ? next : card))
          : [...prev, next];
        persistSnapshot(merged);
        return merged;
      });
    } finally {
      setBusyId(null);
    }
  };

  const summary = useMemo(() => {
    const connected = cards.filter((card) => card.status === 'connected').length;
    const down = cards.filter((card) => card.status !== 'connected').length;
    const records = cards.reduce((sum, card) => sum + (Number.isFinite(card.records) ? card.records : 0), 0);
    return { connected, down, records };
  }, [cards]);

  if (!unlocked) {
    return <AdminGate onUnlocked={() => setUnlocked(true)} />;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-400/15 text-brand-800 dark:text-brand-300 px-3 py-1 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            مراقبة داخلية
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">لوحة مراقبة واجهات البيانات</h1>
          <p className="text-sm text-neutral-600 dark:text-zinc-300 max-w-2xl">
            حالة الاتصال والسجلات المتزامنة لكل مصدر: فنادق تركيا، GIS، Google Places، RapidAPI، Supabase، Overpass، والترميز الجغرافي، مع خزينة المتصفح.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-neutral-950 font-semibold px-4 py-2.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            تحديث الكل
          </button>
          <button
            type="button"
            onClick={() => {
              lockAdmin();
              setUnlocked(false);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-zinc-200"
          >
            <Lock className="w-4 h-4" />
            قفل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-1">واجهات متصلة</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {summary.connected}
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
          <p className="text-xs text-red-800 dark:text-red-300 mb-1">غير متصلة / خطأ</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CircleAlert className="w-5 h-5 text-red-500" />
            {summary.down}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-1">إجمالي السجلات الظاهرة</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            {summary.records.toLocaleString('en-US')}
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && cards.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-64 rounded-2xl shimmer-bg animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-10">
          {cards.map((card) => (
            <HealthCard
              key={card.id}
              card={card}
              busy={loading || busyId === card.id}
              expanded={Boolean(expanded[card.id])}
              onToggle={() => setExpanded((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
              onRefresh={() => void refreshOne(card.id)}
            />
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5">
          <table className="w-full min-w-[720px] text-sm text-right">
            <thead className="bg-neutral-50 dark:bg-black/30 text-neutral-600 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-semibold">المصدر</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">السجلات</th>
                <th className="px-4 py-3 font-semibold">آخر مزامنة</th>
                <th className="px-4 py-3 font-semibold">الملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const tone = statusTone(card.status);
                return (
                  <tr key={card.id} className="border-t border-neutral-200 dark:border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 dark:text-white">{card.name}</div>
                      <div className="text-xs text-neutral-500">{card.nameEn}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                        <span className="text-neutral-800 dark:text-zinc-100">{tone.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-900 dark:text-white">{card.records.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-zinc-300">{formatTime(card.lastSync)}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-zinc-300 max-w-[280px]">
                      <span className="line-clamp-2">{card.detail}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-2">
        <Unplug className="w-3.5 h-3.5" />
        المفاتيح السرية تبقى على الخادم. هذه اللوحة تعرض الحالة والأعداد فقط.
      </p>
    </div>
  );
}
