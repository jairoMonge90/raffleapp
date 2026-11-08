import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Plus,
  Play,
  Trophy,
  Hash,
  Sparkles,
  Search,
  UserPlus,
  CheckCircle2,
  Calendar,
  XCircle,
  Clock
} from 'lucide-react';
import { Raffle, AppUser } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { AppLanguage } from '../utils/storage';
import { getT } from '../utils/i18n';

interface Props {
  raffle: Raffle;
  allUsers: AppUser[];
  onBack: () => void;
  onOpenAcquireModal: () => void;
  onOpenCreateUserModal: () => void;
  onSelectUserDetail: (user: AppUser, numbers: number[]) => void;
  onStartDraw: (raffle: Raffle) => void;
  language?: AppLanguage;
}

export const RaffleDetailView: React.FC<Props> = ({
  raffle,
  allUsers,
  onBack,
  onOpenAcquireModal,
  onOpenCreateUserModal,
  onSelectUserDetail,
  onStartDraw,
  language = 'es',
}) => {
  const [search, setSearch] = useState('');
  const t = getT(language);

  const isCompleted = raffle.status === 'completed';

  // Calculate stats
  const totalAssigned = raffle.assignments.reduce(
    (acc, a) => acc + a.assignedNumbers.length,
    0
  );
  const availableCount = raffle.totalNumbers - totalAssigned;
  const percentAssigned = Math.round((totalAssigned / raffle.totalNumbers) * 100);

  const getUserById = (userId: string) => allUsers.find((u) => u.id === userId);

  // Filter participants
  const filteredAssignments = raffle.assignments.filter((assignment) => {
    const user = getUserById(assignment.userId);
    if (!user) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = user.name.toLowerCase().includes(q);
    const numMatch = assignment.assignedNumbers.some((n) => String(n).includes(q));
    return nameMatch || numMatch;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group py-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t.backToRaffles}</span>
        </button>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
            isCompleted
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
          }`}
        >
          {isCompleted
            ? (language === 'en' ? 'Completed Draw' : 'Sorteo Realizado')
            : (language === 'en' ? 'Active Raffle' : 'Sorteo Activo')}
        </span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* COMPLETED RAFFLE VIEW: WINNERS ONLY (PER SPEC)       */}
      {/* ---------------------------------------------------- */}
      {isCompleted ? (
        <div className="space-y-6">
          {/* Header of Completed Raffle */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-50 dark:from-amber-950/40 via-white dark:via-slate-900 to-amber-100/30 dark:to-slate-950 border border-amber-200 dark:border-amber-500/30 shadow-xl text-center relative overflow-hidden transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
              <Trophy className="w-9 h-9" />
            </div>

            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {language === 'en' ? 'Official Results' : 'Resultados Oficiales'}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {raffle.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Drawn on ' : 'Realizado el '}
                {new Date(raffle.completedDraw?.drawDate || raffle.createdAt).toLocaleDateString(
                  language === 'en' ? 'en-US' : 'es-ES',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </span>
            </p>
          </div>

          {/* Winner Profile Card(s) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>
                {language === 'en'
                  ? `Official Winner${raffle.completedDraw?.winners.length !== 1 ? 's' : ''}`
                  : `Ganador${raffle.completedDraw?.winners.length !== 1 ? 'es' : ''} Oficial`}
              </span>
            </h3>

            {raffle.completedDraw?.winners.map((winner) => {
              const u = getUserById(winner.userId);
              return (
                <div
                  key={winner.place}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <UserAvatar
                      photoUrl={u?.photoUrl}
                      name={u?.name || (language === 'en' ? 'Winner' : 'Ganador')}
                      gender={u?.gender}
                      size="xl"
                    />
                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wide mb-1">
                        🏆 {winner.place}º {language === 'en' ? 'Place Winner' : 'Lugar Ganador'}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {u?.name || (language === 'en' ? 'User' : 'Usuario')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {u?.phone || (language === 'en' ? 'No phone number' : 'Sin número de contacto')}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right px-6 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                      {t.winningTicket}
                    </span>
                    <span className="font-mono text-3xl font-black text-amber-600 dark:text-amber-400">
                      #{winner.number}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disqualified list (if any) */}
          {raffle.completedDraw?.disqualified && raffle.completedDraw.disqualified.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Disqualified Numbers During Draw' : 'Boletos Descalificados en el Sorteo'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {raffle.completedDraw.disqualified.map((item) => {
                  const u = getUserById(item.userId);
                  return (
                    <div
                      key={item.order}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs shadow-sm transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar photoUrl={u?.photoUrl} name={u?.name || ''} gender={u?.gender} size="sm" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{u?.name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.message}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-500 dark:text-rose-400">#{item.number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* ACTIVE RAFFLE VIEW: PARTICIPANTS & STATS             */
        /* ---------------------------------------------------- */
        <div className="space-y-6">
          {/* Top Info Banner per specification:
              "en la parte de arriba se mostrará información de la rifa actual por ejemplo
              cuantos numeros en total hay en esta rifa, cuantos han sido asignados y cuantos estan disponibles" */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
                  {language === 'en' ? 'Active Raffle' : 'Sorteo Activo'}
                </span>
                <h1 className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-wider">
                  {raffle.name}
                </h1>
              </div>

              {totalAssigned > 0 && (
                <button
                  onClick={() => onStartDraw(raffle)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{language === 'en' ? 'Draw Raffle Now' : 'Realizar Sorteo Ahora'}</span>
                </button>
              )}
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center transition-colors">
                <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                  {language === 'en' ? 'Total Numbers' : 'Total Números'}
                </span>
                <span className="font-mono text-xl md:text-2xl font-black text-slate-900 dark:text-slate-200">
                  {raffle.totalNumbers}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-center transition-colors">
                <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-300 block tracking-wider">
                  {t.assigned}
                </span>
                <span className="font-mono text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {totalAssigned}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center transition-colors">
                <span className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-300 block tracking-wider">
                  {language === 'en' ? 'Available' : 'Disponibles'}
                </span>
                <span className="font-mono text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {availableCount}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{language === 'en' ? 'Assignment progress' : 'Progreso de asignación'}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{percentAssigned}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, percentAssigned)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar per specification:
              "El lista de usarios de la rifa o sorteo tendrá que haber una opcion para adquirir numeros y agregar usuarios" */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAcquireModal}
                disabled={availableCount === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Acquire / Assign Numbers' : 'Adquirir / Asignar Números'}</span>
              </button>

              <button
                onClick={onOpenCreateUserModal}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
              >
                <UserPlus className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                <span>{language === 'en' ? 'Add New User' : 'Agregar Nuevo Usuario'}</span>
              </button>
            </div>

            {/* Search Input for Participants */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search participant or number...' : 'Buscar participante o número...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Participants List per specification:
              "los sorteos activos mostrarán la lista de usuarios que han adquirido sus respectivos numeros,
              mostrando el nombre del usuario y la cantidad de numeros adquiridos o asignados...
              al seleccionar un usuario especifico se desplegará un historial detallado de todos sus números" */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'en'
                  ? `Participating Users (${raffle.assignments.length})`
                  : `Usuarios Participantes (${raffle.assignments.length})`}
              </span>
              <span>
                {language === 'en'
                  ? 'Tap a user to view history or return tickets'
                  : 'Toca un usuario para ver historial o devolver boletos'}
              </span>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">
                  {raffle.assignments.length === 0
                    ? (language === 'en' ? 'No users with tickets assigned yet' : 'Aún no hay usuarios con números asignados')
                    : (language === 'en' ? 'No participants matched the search' : 'No se encontraron participantes con ese criterio')}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {raffle.assignments.length === 0
                    ? (language === 'en' ? 'Start assigning numbers to registered users in your app.' : 'Comienza asignando números a los usuarios registrados en tu app.')
                    : (language === 'en' ? 'Try searching another name or ticket number.' : 'Intenta con otro nombre o número.')}
                </p>
                {raffle.assignments.length === 0 && (
                  <button
                    onClick={onOpenAcquireModal}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition"
                  >
                    {language === 'en' ? 'Assign Numbers Now' : 'Asignar Números Ahora'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAssignments.map((assignment) => {
                  const user = getUserById(assignment.userId);
                  if (!user) return null;

                  return (
                    <div
                      key={assignment.userId}
                      onClick={() => onSelectUserDetail(user, assignment.assignedNumbers)}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          photoUrl={user.photoUrl}
                          name={user.name}
                          gender={user.gender}
                          size="md"
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition block">
                            {user.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {user.phone || (language === 'en' ? 'Participant' : 'Participante')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 block">
                          {assignment.assignedNumbers.length}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                          {language === 'en' ? 'tickets' : 'boletos'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
