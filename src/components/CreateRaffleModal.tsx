import React, { useState } from 'react';
import { X, Sparkles, Hash, AlertCircle } from 'lucide-react';
import { generateRaffleName } from '../utils/naming';
import { Raffle } from '../types';
import { soundEffects } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nextCorrelative: number;
  onRaffleCreated: (raffle: Raffle) => void;
}

export const CreateRaffleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nextCorrelative,
  onRaffleCreated,
}) => {
  const [totalNumbers, setTotalNumbers] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generatedName = generateRaffleName(nextCorrelative);

  const presets = [50, 100, 200, 500, 1000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(totalNumbers) || totalNumbers < 2) {
      setError('La rifa debe tener al menos 2 números para sortear.');
      return;
    }
    if (totalNumbers > 10000) {
      setError('El límite máximo recomendado es de 10,000 números.');
      return;
    }

    const newRaffle: Raffle = {
      id: `raf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: generatedName,
      correlativeNumber: nextCorrelative,
      totalNumbers,
      status: 'active',
      createdAt: Date.now(),
      assignments: [],
    };

    onRaffleCreated(newRaffle);
    soundEffects.playSuccessChime();
    soundEffects.vibrate([40, 30, 40]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Crear Nuevo Sorteo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Solo especifica la cantidad de números</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Generated Code Preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Identificador generado automáticamente
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {generatedName}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-semibold">
                Correlativo #{String(nextCorrelative).padStart(4, '0')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              (Día - DD - MM - AA - Correlativo único de 4 dígitos)
            </p>
          </div>

          {/* Total Numbers Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Cantidad total de números a sortear *
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={2}
                max={10000}
                required
                value={totalNumbers || ''}
                onChange={(e) => {
                  setError(null);
                  setTotalNumbers(parseInt(e.target.value, 10));
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej. 100"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Rápidos:</span>
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setError(null);
                    setTotalNumbers(preset);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    totalNumbers === preset
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {preset} núm.
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
            >
              Crear Sorteo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
