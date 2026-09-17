import { useState } from 'react';
import { Plane, Moon, Sun, Menu, X, LayoutGrid, Compass, Shield, Star, MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { PageKey } from '@/types';

interface HeaderProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
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

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-neutral-200 dark:border-brand-400/15">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-400/30">
              <Plane className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-right">
              <div className="text-neutral-900 dark:text-white font-bold text-base leading-tight">دليل المسافر</div>
              <div className="text-brand-700 dark:text-brand-300/70 text-[10px] leading-tight">المنصة الذكية للمسافر</div>
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

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="w-10 h-10 rounded-lg glass flex items-center justify-center cursor-pointer text-neutral-700 hover:text-brand-600 dark:text-zinc-300 dark:hover:text-brand-400 transition-all hover:bg-neutral-900/5 dark:hover:bg-white/10"
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-10 h-10 rounded-lg glass flex items-center justify-center cursor-pointer text-neutral-700 dark:text-zinc-300">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden py-3 border-t border-white/10 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button key={item.key} onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
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
