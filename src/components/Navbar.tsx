import React from 'react';
import { Home, Play, Plus, Settings, Clover, WifiOff } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppLanguage } from '../utils/storage';
import { getT } from '../utils/i18n';

interface Props {
  currentTab: 'home' | 'settings';
  onSelectTab: (tab: 'home' | 'settings') => void;
  centerMode: 'create' | 'draw';
  onCenterClick: () => void;
  canPerformCenterAction?: boolean;
  isOnline?: boolean;
  language?: AppLanguage;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  centerMode,
  onCenterClick,
  canPerformCenterAction = true,
  isOnline = true,
  language = 'es',
}) => {
  const t = getT(language);

  return (
    <>
      {/* Top Header Bar (Positioned safely below device status bar / notch) */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)', paddingBottom: '4px' }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand with Four-Leaf Clover */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Clover className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                RaffleApp
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase leading-none">
                {t.appNameSubtitle}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.offlineMode}</span>
              </div>
            )}
            <PWAInstallButton variant="button" />
          </div>
        </div>
      </header>

      {/* Bottom Floating Navigation Bar (Thumb Zone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe shadow-2xl transition-colors">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Left: Home */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition ${
              currentTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-semibold tracking-tight mt-1">{t.home}</span>
          </button>

          {/* Center: Dynamic Action Button (Plus for Creating Raffle on list, Play for Live Draw on raffle screen) */}
          <div className="relative -top-5">
            <button
              onClick={onCenterClick}
              disabled={!canPerformCenterAction}
              className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl ring-4 ring-slate-100 dark:ring-slate-900 hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed group ${
                centerMode === 'create'
                  ? 'bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 shadow-indigo-500/40'
                  : 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 shadow-emerald-500/40'
              }`}
              title={centerMode === 'create' ? t.createRaffle : t.drawRaffleNow}
            >
              {centerMode === 'create' ? (
                <Plus className="w-7 h-7 text-white stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {centerMode === 'create' ? t.createRaffle : t.draw}
            </span>
          </div>

          {/* Right: Settings */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition ${
              currentTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-semibold tracking-tight mt-1">{t.settings}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
