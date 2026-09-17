import { Shield, Plane, Clock, User, Mail, Phone, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { FLYWAY_URL } from '@/types';

export default function InsurancePage() {
  const estimatedPrice = 35000;

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-400/25">
          <Shield className="w-8 h-8 text-neutral-950" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">تأمين السفر الدولي</h1>
        <p className="text-neutral-600 dark:text-zinc-300 text-sm max-w-2xl mx-auto">
          احمِ رحلتك بوثيقة تأمين سياحي شاملة. تعرف على التفاصيل والتكلفة التقديرية، ثم أكمل الإصدار عبر نظام Flyway.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-dark rounded-2xl p-6 border border-brand-700/20">
          <h3 className="text-neutral-900 dark:text-white font-bold text-lg mb-5">ماذا يغطي التأمين؟</h3>
          <ul className="space-y-3">
            {[
              'تغطية المصارف الطبية الطارئة حتى 100,000 دولار',
              'الإخلاء الطبي والنقل للمستشفى',
              'فقدان أو تأخير الأمتعة',
              'إلغاء الرحلة المفاجئ',
              'المساعدة القانونية في الخارج',
              'تغطية الأمراض المزمنة (بشروط)',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-neutral-700 dark:text-zinc-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="glass-dark rounded-2xl p-6 border border-brand-700/20">
            <h3 className="text-neutral-900 dark:text-white font-bold text-lg mb-4">ملخص التأمين</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-neutral-600 dark:text-zinc-400 text-sm">الوجهة</span>
                <span className="text-neutral-900 dark:text-white text-sm font-medium">حسب اختيارك</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-neutral-600 dark:text-zinc-400 text-sm">المدة</span>
                <span className="text-neutral-900 dark:text-white text-sm font-medium">حسب اختيارك</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-neutral-600 dark:text-zinc-400 text-sm">الجنسية</span>
                <span className="text-neutral-900 dark:text-white text-sm font-medium">عراقي</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-600 dark:text-zinc-400 text-sm">التكلفة التقديرية</span>
                <span className="text-brand-700 dark:text-brand-300 font-bold text-xl">{estimatedPrice.toLocaleString('en-US')} د.ع</span>
              </div>
            </div>
            <a href={FLYWAY_URL} target="_blank" rel="noopener noreferrer"
              className="w-full btn-primary py-3.5 rounded-xl text-base font-semibold cursor-pointer flex items-center justify-center gap-2 no-underline mt-4">
              إصدار الوثيقة عبر Flyway
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="glass rounded-xl p-4 flex items-start gap-3 border border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-neutral-600 dark:text-zinc-400 text-xs leading-relaxed">
              الأسعار المعروضة مرجعية فقط. يتم إصدار الوثيقة النهائية عبر نظام Flyway مع إرسال نسخة إلى بريدك الإلكتروني ورسالة SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
