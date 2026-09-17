import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  { question: 'ما هي شروط الفيزا لتركيا؟', answer: 'تحتاج إلى جواز سفر ساري لمدة 6 أشهر، صورة بيومترية، كشف حساب بنكي، والتقديم عبر مكاتب معتمدة. ابحث عن تركيا في قسم التأشيرات للتفاصيل.' },
  { question: 'هل أحتاج فيزا لماليزيا؟', answer: 'لا، العراقيون معفيون من الفيزا المسبقة لماليزيا. تحتاج فقط لتعبئة بطاقة MDAC الإلكترونية قبل 3 أيام من السفر.' },
  { question: 'كيف أجد فندق قريب من المترو؟', answer: 'تصفح قسم دليل الفنادق — كل فندق يعرض معلومات القرب من محطات المترو والمعالم السياحية.' },
  { question: 'أين أجد صيدلية 24/7؟', answer: 'في الدليل الشامل، اختر فئة "صيدليات 24/7" للعثور على صيدليات مفتوحة ليلاً مع أدوية مستوردة وخدمة توصيل.' },
  { question: 'كيف أحصل على شريحة SIM سياحية؟', answer: 'في الدليل الشامل، اختر فئة "اتصالات وSIM" للعثور على مزودين يقدمون باقات سياحية بتفعيل فوري بالجواز.' },
  { question: 'ما هي تكلفة تأمين السفر؟', answer: 'تختلف حسب الوجهة والمدة والعمر. راجع قسم تأمين السفر لمعرفة التكلفة التقديرية بالدينار العراقي.' },
  { question: 'كيف أتواصل مع السفارة العراقية؟', answer: 'افتح أداة الطوارئ في الشريط العلوي ثم ابحث عن الدولة — ستظهر أرقام الطوارئ والبعثات العراقية مع زر لفتح موقعها على الخريطة.' },
];

interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

interface ChatWidgetProps {
  lifted?: boolean;
}

export default function ChatWidget({ lifted = false }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, text: 'مرحباً! أنا مساعد Flyway الذكي. اسأل عن التأشيرات، الطوارئ، العملات أو أقرب سفارة عراقية.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || fabRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), text, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const lower = text.toLowerCase();
    const faq = faqs.find((f) => text.includes(f.question.slice(0, 10)) || lower.includes(f.question.slice(0, 5)));
    const reply = faq?.answer || 'شكراً لرسالتك! للمزيد: محوّل العملات وأرقام الطوارئ في الشريط العلوي، والخريطة الذكية للسفارات والمواقع. أو زر flyway.travel.';

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
    }, 500);
  };

  const fabPos = lifted ? 'bottom-24 sm:bottom-6' : 'bottom-5';

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
          className={`fixed ${lifted ? 'bottom-44 sm:bottom-24' : 'bottom-24'} left-4 right-4 sm:right-auto sm:w-[380px] z-[95] max-h-[min(72vh,560px)] glass-dark rounded-3xl border border-white/20 dark:border-brand-400/25 shadow-2xl overflow-hidden animate-slide-content backdrop-blur-2xl`}
        >
          <div className="bg-brand-400/95 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-neutral-950 font-bold text-sm">مساعد Flyway الذكي</p>
              <p className="text-neutral-800 text-xs">متصل الآن — اسأل عن سفرك</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-neutral-950/10 flex items-center justify-center text-neutral-800 hover:bg-neutral-950/20 cursor-pointer shrink-0" aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="h-[min(280px,38vh)] overflow-y-auto p-4 space-y-3 bg-white/40 dark:bg-neutral-950/40">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.sender === 'user'
                    ? 'bg-brand-400 text-neutral-950 rounded-bl-md'
                    : 'bg-white/80 dark:bg-white/10 text-neutral-800 dark:text-zinc-100 rounded-br-md border border-white/40 dark:border-white/10'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {faqs.slice(0, 4).map((f, i) => (
                <button key={i} onClick={() => sendMessage(f.question)}
                  className="text-xs glass px-3 py-1.5 rounded-full text-neutral-700 hover:text-neutral-900 dark:text-zinc-200/80 dark:hover:text-white hover:bg-brand-600/30 transition-all cursor-pointer">
                  {f.question}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="اكتب رسالتك..."
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
