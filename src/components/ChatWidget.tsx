import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, MapPin, MessageCircle, Navigation, Phone, Send, Sparkles, X } from 'lucide-react';
import {
  answerConcierge,
  CONCIERGE_SHORTCUTS,
  makeConciergeGreeting,
  type ConciergeAction,
  type ConciergeLocale,
  type ConciergePlace,
} from '@/lib/flywayConcierge';
import { detectLocaleInText } from '@/lib/cityCoordinates';
import { bootPlaceVault } from '@/lib/placeVault';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  places?: ConciergePlace[];
  actions?: ConciergeAction[];
}

export interface ChatWidgetProps {
  lifted?: boolean;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  onOpenPlace?: (place: ConciergePlace) => void;
  onAction?: (action: ConciergeAction) => void;
  onFocusLocale?: (locale: ConciergeLocale) => void;
}

export default function ChatWidget({
  lifted = false,
  city,
  country,
  lat,
  lng,
  onOpenPlace,
  onAction,
  onFocusLocale,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [rememberedCity, setRememberedCity] = useState<string | null>(city || null);
  const [rememberedDistrict, setRememberedDistrict] = useState<string | null>(null);
  const greeting = useMemo(
    () => makeConciergeGreeting({ city, country, lat, lng, rememberedCity, rememberedDistrict }),
    [city, country, lat, lng, rememberedCity, rememberedDistrict],
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 0, text: makeConciergeGreeting({ city, country, lat, lng }), sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const idleRef = useRef(true);

  useEffect(() => {
    setRememberedCity((prev) => city || prev);
  }, [city]);

  useEffect(() => {
    if (!idleRef.current) return;
    setMessages([{ id: 0, text: greeting, sender: 'bot' }]);
  }, [greeting]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    void bootPlaceVault();
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || fabRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const sendMessage = (text: string) => {
    if (!text.trim() || busy) return;
    idleRef.current = false;
    const userMsg: ChatMessage = { id: Date.now(), text, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBusy(true);
    const mentioned = detectLocaleInText(text, rememberedCity || city);
    if (mentioned?.city) setRememberedCity(mentioned.city.name);
    if (mentioned?.districtName) setRememberedDistrict(mentioned.districtName);
    else if (mentioned?.city) setRememberedDistrict(null);

    window.setTimeout(() => {
      const reply = answerConcierge(text, {
        city,
        country,
        lat,
        lng,
        rememberedCity: mentioned?.city.name || rememberedCity || city,
        rememberedDistrict: mentioned?.districtName || (mentioned?.city ? null : rememberedDistrict),
      });
      if (reply.locale && (reply.locale.district || reply.places.length > 0 || reply.actions.some((a) => a.page === 'navigator'))) {
        onFocusLocale?.(reply.locale);
      }
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: reply.text,
        sender: 'bot',
        places: reply.places,
        actions: reply.actions,
      }]);
      setBusy(false);
    }, 280);
  };

  const fabPos = lifted ? 'bottom-4' : 'bottom-5';
  const cityHint = rememberedDistrict
    ? `${rememberedDistrict}، ${rememberedCity || city || ''}`.replace(/،\s*$/, '')
    : rememberedCity || city;

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed ${fabPos} left-4 z-[90] w-14 h-14 rounded-full cursor-pointer border border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl flex items-center justify-center transition-transform duration-300 hover:scale-105 ${
          open
            ? 'bg-neutral-950 text-brand-400'
            : 'bg-brand-400/90 text-neutral-950 fab-pulse'
        }`}
        title="مساعد Flyway الذكي"
        aria-label="مساعد Flyway الذكي"
        aria-pressed={open}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-950 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-neutral-950" />
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className={`fixed ${lifted ? 'bottom-24' : 'bottom-24'} left-4 right-4 sm:right-auto sm:w-[400px] z-[95] max-h-[min(78vh,620px)] glass-dark rounded-3xl border border-white/20 dark:border-brand-400/25 shadow-2xl overflow-hidden animate-slide-content backdrop-blur-2xl`}
        >
          <div className="bg-brand-400/95 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-neutral-950 font-bold text-sm">مساعد Flyway الذكي</p>
              <p className="text-neutral-800 text-xs truncate">
                {cityHint ? `متصل — سياق ${cityHint}` : 'متصل الآن — اسأل عن سفرك'}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-neutral-950/10 flex items-center justify-center text-neutral-800 hover:bg-neutral-950/20 cursor-pointer shrink-0" aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="h-[min(320px,42vh)] overflow-y-auto p-4 space-y-3 bg-white/40 dark:bg-neutral-950/40">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-brand-400 text-neutral-950 rounded-bl-md'
                    : 'bg-white/80 dark:bg-white/10 text-neutral-800 dark:text-zinc-100 rounded-br-md border border-white/40 dark:border-white/10'
                }`}>
                  {m.text}
                  {m.places && m.places.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.places.slice(0, 4).map((place) => (
                        <div key={place.id} className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/80 dark:bg-neutral-950/50 p-2.5 text-right">
                          <p className="text-[12px] font-bold text-neutral-950 dark:text-white leading-tight">{place.name}</p>
                          <p className="text-[11px] text-neutral-600 dark:text-zinc-400 mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{place.address}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {place.phone ? (
                              <a
                                href={`tel:${place.phone.replace(/\s+/g, '')}`}
                                className="h-8 px-2.5 rounded-lg bg-neutral-950 text-white text-[11px] font-bold inline-flex items-center gap-1 no-underline"
                              >
                                <Phone className="w-3 h-3" /> اتصال
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                onOpenPlace?.(place);
                                setOpen(false);
                              }}
                              className="h-8 px-2.5 rounded-lg bg-brand-400 text-neutral-950 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Navigation className="w-3 h-3" /> الخريطة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => {
                            onAction?.(action);
                            if (action.page === 'navigator') setOpen(false);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-brand-400/20 text-neutral-900 dark:text-brand-300 font-semibold cursor-pointer"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-end">
                <div className="text-[11px] text-neutral-500 dark:text-zinc-400 px-3 py-1">يجهّز الجواب من الدليل…</div>
              </div>
            )}
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {CONCIERGE_SHORTCUTS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => sendMessage(chip.prompt)}
                className="text-[11px] glass px-3 py-1.5 rounded-full text-neutral-700 hover:text-neutral-900 dark:text-zinc-200/90 dark:hover:text-white hover:bg-brand-600/30 transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="مثال: أقرب صيدلية 24/7 في إزمير"
              className="flex-1 bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-neutral-900 dark:text-white text-sm outline-none focus:border-brand-400"
            />
            <button type="button" onClick={() => sendMessage(input)}
              className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center cursor-pointer shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
