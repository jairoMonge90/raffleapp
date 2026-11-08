import React, { useState } from 'react';
import { X, Plus, RotateCcw, AlertTriangle, Sparkles, Hash, AlertCircle } from 'lucide-react';
import { AppUser, Raffle } from '../types';
import { UserAvatar } from './UserAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  raffle: Raffle;
  userNumbers: number[];
  availableCount: number;
  onAcquireMore: (count: number) => number[];
  onReturnNumbers: (count: number) => { returned: number[]; removedCompletely: boolean };
}

export const UserDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  raffle,
  userNumbers,
  availableCount,
  onAcquireMore,
  onReturnNumbers,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'acquire' | 'return'>('view');
  const [acquireCount, setAcquireCount] = useState<number>(1);
  const [returnCount, setReturnCount] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [recentAcquired, setRecentAcquired] = useState<number[] | null>(null);
  const [recentReturned, setRecentReturned] = useState<{ count: number; wasRemoved: boolean } | null>(null);

  if (!isOpen) return null;

  const handleAcquireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (acquireCount <= 0 || isNaN(acquireCount)) {
      setError('Debes especificar al menos 1 número.');
      return;
    }
    if (acquireCount > availableCount) {
      setError(`Solo hay ${availableCount} números disponibles en esta rifa.`);
      return;
    }

    const assigned = onAcquireMore(acquireCount);
    setRecentAcquired(assigned);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (returnCount <= 0 || isNaN(returnCount)) {
      setError('Debes devolver al menos 1 número.');
      return;
    }
    if (returnCount > userNumbers.length) {
      setError(`El usuario solo tiene ${userNumbers.length} números asignados.`);
      return;
    }

    const res = onReturnNumbers(returnCount);
    setRecentReturned({
      count: res.returned.length,
      wasRemoved: res.removedCompletely,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <UserAvatar photoUrl={user.photoUrl} name={user.name} gender={user.gender} size="lg" />
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{user.phone || 'Sin teléfono'}</span>
                <span>·</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{userNumbers.length} boletos</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        {!recentAcquired && !recentReturned && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl my-4">
            <button
              onClick={() => {
                setActiveTab('view');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                activeTab === 'view' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mis Números ({userNumbers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('acquire');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'acquire' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Adquirir Más
            </button>
            <button
              onClick={() => {
                setActiveTab('return');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'return' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Devolver
            </button>
          </div>
        )}

        {/* Tab 1: View Numbers */}
        {activeTab === 'view' && !recentAcquired && !recentReturned && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Historial de números asignados en esta rifa:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total: {userNumbers.length}</span>
            </div>

            <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
              {userNumbers.length === 0 ? (
                <p className="text-center w-full py-8 text-xs text-slate-500">
                  El usuario no tiene números asignados actualmente en esta rifa.
                </p>
              ) : (
                userNumbers
                  .slice()
                  .sort((a, b) => a - b)
                  .map((num) => (
                    <span
                      key={num}
                      className="font-mono px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-sm"
                    >
                      #{num}
                    </span>
                  ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('acquire')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Adquirir más números
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('return')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" />
                Devolver números
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Acquire More Numbers */}
        {activeTab === 'acquire' && !recentAcquired && (
          <form onSubmit={handleAcquireSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 block font-semibold">Números Disponibles en la Rifa</span>
                <span className="text-[11px] text-slate-400">Total en el sorteo: {raffle.totalNumbers}</span>
              </div>
              <span className="font-mono text-xl font-extrabold text-indigo-400">
                {availableCount}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ¿Cuántos números adicionales desea adquirir?
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={availableCount}
                  value={acquireCount || ''}
                  onChange={(e) => {
                    setError(null);
                    setAcquireCount(parseInt(e.target.value, 10));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. 2"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Rápidos:</span>
                {[1, 2, 5, 10].map((qty) => (
                  <button
                    type="button"
                    key={qty}
                    disabled={qty > availableCount}
                    onClick={() => setAcquireCount(qty)}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition ${
                      acquireCount === qty
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 disabled:opacity-40'
                    }`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Los nuevos números serán asignados <strong>aleatoriamente</strong> de los boletos disponibles.
              </p>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={availableCount === 0 || acquireCount <= 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg transition"
              >
                Confirmar y Adquirir
              </button>
            </div>
          </form>
        )}

        {/* Receipt Screen for newly acquired */}
        {recentAcquired && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">¡Números Adquiridos!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Se han añadido <strong className="text-indigo-400">{recentAcquired.length} números</strong> al historial de {user.name}
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto flex flex-wrap justify-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              {recentAcquired.map((num) => (
                <span
                  key={num}
                  className="font-mono px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-sm"
                >
                  #{num}
                </span>
              ))}
            </div>

            <button
              onClick={() => {
                setRecentAcquired(null);
                setActiveTab('view');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Ver Lista Completa
            </button>
          </div>
        )}

        {/* Tab 3: Return Numbers */}
        {activeTab === 'return' && !recentReturned && (
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Devolución de Boletos</span>
              </div>
              <p className="text-[11px] text-slate-300">
                El usuario tiene actualmente <strong>{userNumbers.length} números</strong>. Si devuelve la totalidad de sus números,{' '}
                <span className="text-amber-300 font-semibold">su nombre será retirado de la lista de participantes</span> de esta rifa.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ¿Cuántos números desea devolver?
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={userNumbers.length}
                  value={returnCount || ''}
                  onChange={(e) => {
                    setError(null);
                    setReturnCount(parseInt(e.target.value, 10));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Ej. 1"
                />
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setReturnCount(1)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                >
                  Devolver 1
                </button>
                <button
                  type="button"
                  onClick={() => setReturnCount(userNumbers.length)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
                >
                  Devolver Todos ({userNumbers.length})
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={userNumbers.length === 0 || returnCount <= 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg transition"
              >
                Confirmar Devolución
              </button>
            </div>
          </form>
        )}

        {/* Receipt Screen for Returned */}
        {recentReturned && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Devolución Exitosa</h3>
              <p className="text-xs text-slate-400 mt-1">
                Se han devuelto <strong className="text-white">{recentReturned.count} números</strong> a la disponibilidad general.
              </p>
              {recentReturned.wasRemoved && (
                <p className="text-xs text-amber-300 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  El usuario devolvió todos sus boletos y fue retirado de la lista de participantes de esta rifa.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setRecentReturned(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Cerrar y Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
