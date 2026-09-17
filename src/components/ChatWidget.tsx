import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

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
  { question: 'كيف أتواصل مع السفارة العراقية؟', answer: 'في الدليل الشامل، اختر فئة "سفارة وشرطة" للعثور على أرقام الطوارئ وعناوين السفارات.' },
];

interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, text: 'مرحباً! أنا مساعد Flyway. كيف يمكنني مساعدتك؟', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), text, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const lower = text.toLowerCase();
    const faq = faqs.find((f) => text.includes(f.question.slice(0, 10)) || lower.includes(f.question.slice(0, 5)));
    const reply = faq?.answer || 'شكراً لرسالتك! للمزيد من المساعدة، يمكنك تصفح أقسام الدليل في الموقع أو زيارة flyway.travel.';

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
    }, 600);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-[200] w-14 h-14 rounded-full bg-brand-400 flex items-center justify-center shadow-2xl shadow-brand-400/30 cursor-pointer hover:scale-110 transition-transform"
        title="الدعم المباشر"
      >
        {open ? <X className="w-6 h-6 text-neutral-950" /> : <MessageCircle className="w-6 h-6 text-neutral-950" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-[200] w-[360px] max-w-[calc(100vw-3rem)] glass-dark rounded-2xl border border-brand-700/30 shadow-2xl animate-scale-in overflow-hidden">
          <div className="bg-brand-400 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <p className="text-neutral-950 font-bold text-sm">مساعد Flyway الذكي</p>
              <p className="text-neutral-800 text-xs">متصل الآن</p>
            </div>
          </div>

          <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.sender === 'user'
                    ? 'bg-brand-400 text-neutral-950 rounded-bl-md'
                    : 'glass text-neutral-800 dark:text-zinc-100 rounded-br-md'
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
            <button onClick={() => sendMessage(input)}
              className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center cursor-pointer shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
