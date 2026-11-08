import React, { useState } from 'react';
import { Plus, Trophy, Calendar, CheckCircle2, Hash, Users, ArrowRight } from 'lucide-react';
import { Raffle, AppUser } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { AppLanguage } from '../utils/storage';
import { getT } from '../utils/i18n';

interface Props {
  raffles: Raffle[];
  allUsers: AppUser[];
  onSelectRaffle: (raffle: Raffle) => void;
  onOpenCreateRaffle: () => void;
  onStartDrawForRaffle: (raffle: Raffle) => void;
  language?: AppLanguage;
}

export const HomeView: React.FC<Props> = ({
  raffles,
  allUsers,
  onSelectRaffle,
  onOpenCreateRaffle,
  onStartDrawForRaffle,
  language = 'es',
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const t = getT(language);

  const filteredRaffles = raffles.filter((r) => {
    if (filter === 'active') return r.status === 'active';
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  const activeCount = raffles.filter((r) => r.status === 'active').length;
  const completedCount = raffles.filter((r) => r.status === 'completed').length;

  const getUserById = (userId: string) => allUsers.find((u) => u.id === userId);

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter Segmented Control */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-800 transition-colors">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.all} ({raffles.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'active'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.active} ({activeCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.completed} ({completedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'en'
            ? `Showing ${filteredRaffles.length} raffle${filteredRaffles.length !== 1 ? 's' : ''}`
            : `Mostrando ${filteredRaffles.length} sorteo${filteredRaffles.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Raffles Grid / List */}
      {filteredRaffles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-300">
            {t.noRafflesInTab}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {filter === 'active'
              ? (language === 'en' ? 'All your raffles have been completed or none created yet.' : 'Todos tus sorteos han sido realizados o no has creado ninguno aún.')
              : (language === 'en' ? 'Create your first raffle specifying total numbers.' : 'Crea tu primer sorteo solicitando la cantidad de números.')}
          </p>
          {filter !== 'all' ? (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              {t.viewAllRaffles}
            </button>
          ) : (
            <button
              onClick={onOpenCreateRaffle}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition"
            >
              {t.createRaffleNow}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRaffles.map((raffle) => {
            const isCompleted = raffle.status === 'completed';
            const totalAssigned = raffle.assignments.reduce(
              (acc, a) => acc + a.assignedNumbers.length,
              0
            );
            const percentAssigned = Math.round((totalAssigned / raffle.totalNumbers) * 100);
            const firstWinner = raffle.completedDraw?.winners[0];
            const winnerUser = firstWinner ? getUserById(firstWinner.userId) : null;

            return (
              <div
                key={raffle.id}
                onClick={() => onSelectRaffle(raffle)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition"
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {raffle.name}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        isCompleted
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isCompleted ? (language === 'en' ? 'Completed' : 'Realizado') : (language === 'en' ? 'Active' : 'Activo')}
                    </span>
                  </div>

                  {/* Body Content based on Completed vs Active */}
                  {isCompleted && firstWinner ? (
                    <div className="my-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          photoUrl={winnerUser?.photoUrl}
                          name={winnerUser?.name || 'Ganador'}
                          gender={winnerUser?.gender}
                          size="md"
                        />
                        <div>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">
                            {t.winnerOfRaffle}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                            {winnerUser?.name || 'Usuario'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">
                          {t.winningTicket}
                        </span>
                        <span className="font-mono text-lg font-black text-amber-600 dark:text-amber-400">
                          #{firstWinner.number}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {t.assigned}: <strong className="text-slate-900 dark:text-slate-200">{totalAssigned}</strong> / {raffle.totalNumbers}
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {percentAssigned}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, percentAssigned)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {raffle.assignments.length} {t.participants}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {raffle.totalNumbers - totalAssigned} {t.available}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer of Card */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(raffle.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isCompleted && totalAssigned > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartDrawForRaffle(raffle);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold transition"
                      >
                        {t.drawRaffleNow}
                      </button>
                    )}
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      <span>{t.viewDetails}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
