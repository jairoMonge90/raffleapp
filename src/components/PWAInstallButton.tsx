import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface Props {
  variant?: 'button' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold block">Aplicación Instalada</span>
            <span>RaffleApp está lista para usarse como aplicación nativa en tu dispositivo.</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className={
            variant === 'card'
              ? 'w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-medium shadow-lg hover:brightness-110 active:scale-[0.99] transition'
              : 'flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition'
          }
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4" />
            <span>Instalar RaffleApp en tu dispositivo</span>
          </div>
          {variant === 'card' && <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg">Instalar</span>}
        </button>
      )}

      {isIOS && (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            className={
              variant === 'card'
                ? 'w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-medium hover:bg-slate-700/80 transition'
                : 'flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition'
            }
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Instalar en iPhone / iPad</span>
            </div>
            {variant === 'card' && <span className="text-xs text-indigo-400">Ver cómo</span>}
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold">Instalar en iPhone / Safari</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Agrega RaffleApp a tu pantalla de inicio para abrirla como una app nativa:
                </p>

                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-800">
                    <Share2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-800">
                    <PlusSquare className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                    <span>
                      2. Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong>.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
