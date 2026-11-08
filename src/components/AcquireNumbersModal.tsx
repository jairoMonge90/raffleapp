import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, X, Check, Hash, Sparkles, AlertCircle } from 'lucide-react';
import { AppUser, Raffle } from '../types';
import { UserAvatar } from './UserAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle;
  allUsers: AppUser[];
  onOpenCreateUser: () => void;
  onAssignNumbers: (userId: string, count: number) => { assigned: number[]; user: AppUser };
  preselectedUserId?: string;
}

export const AcquireNumbersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  raffle,
  allUsers,
  onOpenCreateUser,
  onAssignNumbers,
  preselectedUserId,
}) => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || '');
  const [count, setCount] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Sync selectedUserId if preselectedUserId is provided or changes (e.g. newly created user)
  useEffect(() => {
    if (preselectedUserId) {
      setSelectedUserId(preselectedUserId);
      setError(null);
    }
  }, [preselectedUserId]);

  // Success receipt view
  const [receipt, setReceipt] = useState<{ assigned: number[]; user: AppUser } | null>(null);

  // Compute available numbers in this raffle
  const assignedSet = useMemo(() => {
    const set = new Set<number>();
    raffle.assignments.forEach((a) => a.assignedNumbers.forEach((n) => set.add(n)));
    return set;
  }, [raffle.assignments]);

  const availableCount = raffle.totalNumbers - assignedSet.size;

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.phone && u.phone.includes(q))
    );
  }, [allUsers, search]);

  const selectedUser = allUsers.find((u) => u.id === selectedUserId);

  if (!isOpen) return null;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUserId) {
      setError('Por favor selecciona un usuario para asignarle los números.');
      return;
    }

    if (count <= 0 || isNaN(count)) {
      setError('Debes asignar al menos 1 número.');
      return;
    }

    if (count > availableCount) {
      setError(`Solo hay ${availableCount} números disponibles en esta rifa.`);
      return;
    }

    const res = onAssignNumbers(selectedUserId, count);
    setReceipt(res);
  };

  const handleFinish = () => {
    setReceipt(null);
    setSelectedUserId('');
    setCount(1);
    setSearch('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative my-6 transition-colors">
        {/* Receipt / Success Screen */}
        {receipt ? (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold">¡Números Adquiridos con Éxito!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Se asignaron <span className="text-slate-900 dark:text-white font-semibold">{receipt.assigned.length} números</span> a{' '}
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{receipt.user.name}</span>
              </p>
            </div>

            {/* User chip */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 max-w-xs mx-auto">
              <UserAvatar photoUrl={receipt.user.photoUrl} name={receipt.user.name} gender={receipt.user.gender} size="sm" />
              <div className="text-left">
                <span className="text-xs font-semibold block text-slate-900 dark:text-slate-200">{receipt.user.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{receipt.user.phone || 'Sin teléfono'}</span>
              </div>
            </div>

            {/* Badge list of newly acquired numbers */}
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-2">
                Boletos recién asignados de forma aleatoria:
              </span>
              <div className="max-h-48 overflow-y-auto flex flex-wrap justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                {receipt.assigned.map((num) => (
                  <span
                    key={num}
                    className="font-mono px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 font-bold text-sm"
                  >
                    #{num}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg transition"
            >
              Volver a la Rifa
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold">Asignar Números a Usuario</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rifa: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{raffle.name}</span></p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informative stats banner */}
            <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Total en Rifa</span>
                <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-200">{raffle.totalNumbers}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Disponibles</span>
                <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{availableCount} números</span>
              </div>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              {/* Step 1: Select User */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    1. Seleccionar Usuario *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateUser();
                    }}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Crear Nuevo Usuario
                  </button>
                </div>

                {/* Search input */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar usuario por nombre o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Users list scroller */}
                <div className="max-h-44 overflow-y-auto space-y-1.5 p-1 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  {filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      <span>No se encontró ningún usuario.</span>
                      <button
                        type="button"
                        onClick={onOpenCreateUser}
                        className="block mx-auto mt-2 text-indigo-600 dark:text-indigo-400 underline font-medium"
                      >
                        Crear nuevo usuario ahora
                      </button>
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setError(null);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-500 text-slate-900 dark:text-white'
                              : 'bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <UserAvatar photoUrl={user.photoUrl} name={user.name} gender={user.gender} size="sm" />
                            <div>
                              <span className="text-xs font-semibold block text-slate-900 dark:text-slate-200">{user.name}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.phone || 'Sin teléfono'}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-1" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Quantity to Acquire */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  2. ¿Cuántos números deseas asignar? *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={availableCount}
                    value={count || ''}
                    onChange={(e) => {
                      setError(null);
                      setCount(parseInt(e.target.value, 10));
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="Ej. 3"
                  />
                </div>

                {/* Quick count chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Rápidos:</span>
                  {[1, 2, 5, 10].map((qty) => (
                    <button
                      type="button"
                      key={qty}
                      disabled={qty > availableCount}
                      onClick={() => setCount(qty)}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition ${
                        count === qty
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                  {availableCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setCount(availableCount)}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition ml-auto"
                    >
                      Todos ({availableCount})
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Los números serán elegidos <strong>de forma aleatoria</strong> entre los disponibles.
                </p>

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
                  disabled={availableCount === 0 || !selectedUserId || count <= 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Asignar Boletos
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
