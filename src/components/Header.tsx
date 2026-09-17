import { useState } from 'react';
import { Plane, Moon, Sun, Menu, X, LayoutGrid, Compass, Shield, Star, MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import TravelCompanion from '@/components/TravelCompanion';
import type { PageKey } from '@/types';
import type { IraqiMission } from '@/lib/iraqiMissions';

interface HeaderProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  currentCountry?: string;
  onOpenMission?: (mission: IraqiMission) => void;
}

const navItems: { key: PageKey; label: string; icon: typeof Plane }[] = [
  { key: 'home', label: 'الرئيسية', icon: Plane },
  { key: 'navigator', label: 'الخريطة الذكية', icon: Navigation },
  { key: 'directory', label: 'الدليل الشامل', icon: LayoutGrid },
  { key: 'visas', label: 'التأشيرات', icon: Compass },
  { key: 'hotels', label: 'الفنادق', icon: Star },
  { key: 'insurance', label: 'تأمين السفر', icon: Shield },
  { key: 'rewards', label: 'العروض', icon: Star },
  { key: 'discover-iraq', label: 'اكتشف العراق', icon: MapPin },
];

export default function Header({ currentPage, onNavigate, currentCountry, onOpenMission }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickTool, setQuickTool] = useState<'currency' | 'emergency' | null>(null);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-neutral-200 dark:border-brand-400/15 overflow-visible">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-400/30">
              <Plane className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-right min-w-0">
              <div className="text-neutral-900 dark:text-white font-bold text-sm sm:text-base leading-tight truncate">دليل المسافر</div>
              <div className="text-brand-700 dark:text-brand-300/70 text-[10px] leading-tight hidden min-[400px]:block">المنصة الذكية للمسافر</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => onNavigate(item.key)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                  currentPage === item.key
                    ? 'bg-brand-400 text-neutral-950 border border-brand-400 shadow-lg shadow-brand-400/20'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-900/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] ring-1 ring-inset ring-black/[0.06] dark:ring-white/10">
              <TravelCompanion
                expanded={quickTool}
                currentCountry={currentCountry}
                onOpenMission={(mission) => {
                  setQuickTool(null);
                  setMobileOpen(false);
                  onOpenMission?.(mission);
                }}
                onExpand={(next) => {
                  setQuickTool(next);
                  if (next) setMobileOpen(false);
                }}
              />
            </div>
            <button onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg glass flex items-center justify-center cursor-pointer text-neutral-700 hover:text-brand-600 dark:text-zinc-300 dark:hover:text-brand-400 transition-all hover:bg-neutral-900/5 dark:hover:bg-white/10"
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}>
              {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>

            <button onClick={() => { setMobileOpen(!mobileOpen); setQuickTool(null); }}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-lg glass flex items-center justify-center cursor-pointer text-neutral-700 dark:text-zinc-300"
              aria-label="القائمة">
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden py-3 border-t border-white/10 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button key={item.key} onClick={() => { onNavigate(item.key); closeMobile(); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-right text-sm font-medium transition-all cursor-pointer ${
                    currentPage === item.key ? 'bg-brand-400 text-neutral-950' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-900/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
