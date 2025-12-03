'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { memo } from 'react';
import { Home, Library, CalendarDays, User, Dumbbell, Moon, Sun, BarChart3, Calculator, Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Navegación principal (mobile bottom bar) - 5 items más importantes
  const navItems = [
    { icon: Home, label: 'Inicio', path: '/', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: CalendarDays, label: 'Rutinas', path: '/routines', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
    { icon: Dumbbell, label: 'Entrenar', path: '/library', color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { icon: BarChart3, label: 'Stats', path: '/stats', color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { icon: Trophy, label: 'Logros', path: '/achievements', color: 'bg-gradient-to-br from-yellow-500 to-amber-600' },
  ];

  // Navegación desktop (todas las secciones)
  const desktopNavItems = [
    { icon: Home, label: 'Inicio', path: '/', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: Library, label: 'Biblioteca', path: '/library', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: CalendarDays, label: 'Rutinas', path: '/routines', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
    { icon: BarChart3, label: 'Estadísticas', path: '/stats', color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    { icon: Trophy, label: 'Logros', path: '/achievements', color: 'bg-gradient-to-br from-yellow-500 to-amber-600' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-[#1a1f2e] dark:bg-white border-b border-slate-700/50 dark:border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-lg">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white dark:text-slate-900 uppercase tracking-wider leading-tight">
                  GYM TRACKER
                </span>
                <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-600 uppercase tracking-wider -mt-0.5">
                  PRO
                </span>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-2">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={true}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-md ${
                      isActive
                        ? `${item.color} text-white scale-105`
                        : 'bg-slate-700/50 dark:bg-slate-100 text-slate-300 dark:text-slate-600 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}

              {/* Calculator Button */}
              <Link
                href="/calculator"
                prefetch={true}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-md ${
                  pathname === '/calculator'
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white scale-105'
                    : 'bg-slate-700/50 dark:bg-slate-100 text-slate-300 dark:text-slate-600 hover:scale-105'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span className="text-sm">Calculadora 1RM</span>
              </Link>

              {/* Profile Button */}
              <Link
                href="/profile"
                prefetch={true}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-md ${
                  pathname === '/profile'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white scale-105'
                    : 'bg-slate-700/50 dark:bg-slate-100 text-slate-300 dark:text-slate-600 hover:scale-105'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Perfil</span>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/30 dark:hover:bg-slate-100 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Logo & Actions */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 dark:bg-white/80 backdrop-blur-lg border-b border-slate-700/50 dark:border-slate-300">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 rounded-lg shadow-lg">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-wider leading-tight">
                GYM TRACKER
              </span>
              <span className="text-[8px] font-semibold text-orange-500 dark:text-orange-600 uppercase tracking-wider -mt-0.5">
                PRO
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Calculator Button */}
            <Link
              href="/calculator"
              prefetch={true}
              className="p-2 text-slate-300 dark:text-slate-700 hover:bg-slate-800/50 dark:hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Calculator className="w-5 h-5" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 dark:text-slate-700 hover:bg-slate-800/50 dark:hover:bg-slate-100 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Button */}
            <Link
              href="/profile"
              prefetch={true}
              className="p-2 text-slate-300 dark:text-slate-700 hover:bg-slate-800/50 dark:hover:bg-slate-100 rounded-lg transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Bar (5 items) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 dark:bg-white/95 backdrop-blur-lg border-t border-slate-700/50 dark:border-slate-200 z-50 pb-safe">
        <div className="grid grid-cols-5 gap-1 px-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive
                    ? `${item.color} text-white shadow-lg scale-105`
                    : 'text-slate-400 dark:text-slate-600 hover:bg-slate-800/50 dark:hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default memo(Navigation);
