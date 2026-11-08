import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Raffle, AppUser, WinnerRecord, DisqualifiedRecord, CompletedDraw } from '../types';
import { UserAvatar } from './UserAvatar';
import { soundEffects } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle;
  allUsers: AppUser[];
  onDrawCompleted: (completedRaffle: Raffle) => void;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

type DrawPhase = 'config' | 'countdown' | 'rolling' | 'disqualified_revealed' | 'winner_revealed';

const CONSOLATION_MESSAGES = [
  '¡Estuvo tan cerca! Muchas gracias por participar con este boleto.',
  '¡Por un pelo! La suerte estuvo rozando este número.',
  '¡Un gran esfuerzo! Descalificado con todos los honores.',
  '¡Muy cerca de la gloria! Gracias por el entusiasmo y apoyo.',
  '¡Ufff, casi casi! Este número queda fuera por esta ocasión.',
];

export const LiveDrawModal: React.FC<Props> = ({
  isOpen,
  onClose,
  raffle,
  allUsers,
  onDrawCompleted,
  soundEnabled,
  vibrateEnabled,
}) => {
  // Pre-draw configuration states (using strings so user can freely clear/edit without stuck numbers)
  const [disqualifiedInput, setDisqualifiedInput] = useState<string>('1');
  const [winnerInput, setWinnerInput] = useState<string>('1');
  const [configError, setConfigError] = useState<string | null>(null);

  // Runtime stages
  const [phase, setPhase] = useState<DrawPhase>('config');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [rollingDisplayNumber, setRollingDisplayNumber] = useState<number>(0);

  // Sequences tracking
  const [currentRoundType, setCurrentRoundType] = useState<'disqualified' | 'winner'>('disqualified');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);

  // Results accumulators
  const [disqualifiedResults, setDisqualifiedResults] = useState<DisqualifiedRecord[]>([]);
  const [winnerResults, setWinnerResults] = useState<WinnerRecord[]>([]);

  // Sound & Screen controls
  const [muted, setMuted] = useState(!soundEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [forceRotate90, setForceRotate90] = useState(false);

  // Refs for timers & rolling
  const rollingIntervalRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const precomputedSequenceRef = useRef<{
    disqualified: { number: number; userId: string; message: string }[];
    winners: { place: number; number: number; userId: string }[];
  } | null>(null);

  // Map of all participating number entries: { number: number, userId: string }
  const participatingNumbers = React.useMemo(() => {
    const list: { number: number; userId: string }[] = [];
    raffle.assignments.forEach((assignment) => {
      assignment.assignedNumbers.forEach((num) => {
        list.push({ number: num, userId: assignment.userId });
      });
    });
    return list;
  }, [raffle.assignments]);

  const uniqueUsersCount = React.useMemo(() => {
    return new Set(raffle.assignments.map((a) => a.userId)).size;
  }, [raffle.assignments]);

  // Stepper helper numbers
  const parsedDisqualified = disqualifiedInput === '' ? 0 : parseInt(disqualifiedInput, 10);
  const parsedWinners = winnerInput === '' ? 1 : parseInt(winnerInput, 10);

  const changeDisqualified = (delta: number) => {
    setConfigError(null);
    const cur = isNaN(parsedDisqualified) ? 0 : parsedDisqualified;
    const max = Math.max(0, participatingNumbers.length - 1);
    const next = Math.max(0, Math.min(max, cur + delta));
    setDisqualifiedInput(String(next));
  };

  const changeWinners = (delta: number) => {
    setConfigError(null);
    const cur = isNaN(parsedWinners) ? 1 : parsedWinners;
    const max = Math.min(10, participatingNumbers.length);
    const next = Math.max(1, Math.min(max, cur + delta));
    setWinnerInput(String(next));
  };

  // Fullscreen Helpers
  const requestFullScreen = async () => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
        mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
        msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
      };
      const options: FullscreenOptions = { navigationUI: 'hide' };
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen(options);
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen(options);
      }
      setIsFullscreen(true);
    } catch (e) {
      console.warn('Fullscreen request:', e);
    }
  };

  const exitFullScreen = async () => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };
      if (document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch {
      // Ignore
    }
  };

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      exitFullScreen();
    } else {
      requestFullScreen();
    }
  };

  // Lock orientation when starting draw
  const checkAndApplyOrientation = () => {
    if (typeof window === 'undefined') return;
    const isPortrait = window.innerHeight > window.innerWidth;
    // Force horizontal layout via CSS rotation if held in portrait, ignoring system auto-rotate lock
    setForceRotate90(isPortrait);
  };

  const enterLandscapeMode = async () => {
    checkAndApplyOrientation();
    try {
      if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        await screen.orientation.lock('landscape');
      }
    } catch {
      // Orientation lock not supported by browser; CSS rotation handles it 100%
    }
  };

  const exitLandscapeMode = async () => {
    setForceRotate90(false);
    await exitFullScreen();
    try {
      const orientation = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } })?.orientation;
      if (orientation) {
        if (orientation.lock) {
          try {
            await orientation.lock('portrait');
          } catch {
            orientation.unlock?.();
          }
        } else {
          orientation.unlock?.();
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleReturnToHome = async () => {
    await exitLandscapeMode();
    onClose();
  };

  // Listen to orientation and resize changes during the live draw
  useEffect(() => {
    if (phase !== 'config') {
      checkAndApplyOrientation();
      window.addEventListener('resize', checkAndApplyOrientation);
      window.addEventListener('orientationchange', checkAndApplyOrientation);
      return () => {
        window.removeEventListener('resize', checkAndApplyOrientation);
        window.removeEventListener('orientationchange', checkAndApplyOrientation);
      };
    }
  }, [phase]);

  // Clean up timers on unmount or close
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      exitLandscapeMode();
    };
  }, []);

  if (!isOpen) return null;

  const handleStartDrawSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);

    const totalAssigned = participatingNumbers.length;
    const winnerCount = Math.max(1, isNaN(parsedWinners) ? 1 : parsedWinners);
    const disqualifiedCount = Math.max(0, isNaN(parsedDisqualified) ? 0 : parsedDisqualified);

    if (totalAssigned === 0) {
      setConfigError('No hay números asignados en esta rifa para realizar el sorteo.');
      return;
    }

    if (winnerCount < 1 || winnerCount > 10) {
      setConfigError('La cantidad de ganadores debe ser entre 1 y 10.');
      return;
    }

    if (disqualifiedCount < 0) {
      setConfigError('Los descalificados no pueden ser negativos.');
      return;
    }

    const totalRequired = winnerCount + disqualifiedCount;
    if (totalRequired > totalAssigned) {
      setConfigError(
        `La suma de ganadores (${winnerCount}) y descalificados (${disqualifiedCount}) no puede superar los boletos asignados (${totalAssigned}).`
      );
      return;
    }

    // Precompute fair random draws from participating numbers
    const pool = [...participatingNumbers];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const disqualifiedPicks = pool.splice(0, disqualifiedCount).map((item, idx) => ({
      number: item.number,
      userId: item.userId,
      message: CONSOLATION_MESSAGES[idx % CONSOLATION_MESSAGES.length],
    }));

    const winnerPicks = pool.splice(0, winnerCount).map((item, idx) => ({
      place: idx + 1,
      number: item.number,
      userId: item.userId,
    }));

    precomputedSequenceRef.current = {
      disqualified: disqualifiedPicks,
      winners: winnerPicks,
    };

    setDisqualifiedResults([]);
    setWinnerResults([]);

    // Turn screen horizontal and enter fullscreen without system navigation/battery bar
    await requestFullScreen();
    await enterLandscapeMode();

    // Start countdown
    startCountdown(disqualifiedCount > 0 ? 'disqualified' : 'winner', 0);
  };

  // 1. Countdown Phase: 3 -> 2 -> 1 -> 0
  const startCountdown = (roundType: 'disqualified' | 'winner', roundIdx: number) => {
    setCurrentRoundType(roundType);
    setCurrentRoundIndex(roundIdx);
    setPhase('countdown');
    setCountdownNum(3);

    soundEffects.playCountdownBeep(!muted, false);
    soundEffects.vibrate(80, vibrateEnabled);

    let current = 3;
    const interval = window.setInterval(() => {
      current -= 1;
      if (current >= 0) {
        setCountdownNum(current);
        soundEffects.playCountdownBeep(!muted, current === 0);
        soundEffects.vibrate(current === 0 ? [100, 50, 100] : 60, vibrateEnabled);
      } else {
        clearInterval(interval);
        startRolling(roundType, roundIdx);
      }
    }, 1000);
  };

  // 2. Rolling Phase: Numbers changing rapidly for exactly 5 seconds
  const startRolling = (roundType: 'disqualified' | 'winner', roundIdx: number) => {
    setCurrentRoundType(roundType);
    setCurrentRoundIndex(roundIdx);
    setPhase('rolling');

    const duration = 5000; // 5 seconds exact
    const startTime = Date.now();

    const allNumbers = participatingNumbers.map((p) => p.number);

    if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);

    rollingIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const randomNum = allNumbers[Math.floor(Math.random() * allNumbers.length)] || Math.floor(Math.random() * 100) + 1;
      setRollingDisplayNumber(randomNum);
      soundEffects.playTick(!muted);

      if (elapsed >= duration) {
        if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
        finalizeRound(roundType, roundIdx);
      }
    }, 60);
  };

  // Reveal fixed disqualified or winner number
  const finalizeRound = (roundType: 'disqualified' | 'winner', roundIdx: number) => {
    const seq = precomputedSequenceRef.current;
    if (!seq) return;

    soundEffects.playStopThud(!muted);
    soundEffects.vibrate(150, vibrateEnabled);

    if (roundType === 'disqualified') {
      const item = seq.disqualified[roundIdx];
      if (item) {
        setRollingDisplayNumber(item.number);
        soundEffects.playDisqualified(!muted);
        setDisqualifiedResults((prev) => [
          ...prev,
          { order: roundIdx + 1, number: item.number, userId: item.userId, message: item.message },
        ]);
        setPhase('disqualified_revealed');
      }
    } else {
      const item = seq.winners[roundIdx];
      if (item) {
        setRollingDisplayNumber(item.number);
        soundEffects.playWinnerFanfare(!muted);
        soundEffects.vibrate([150, 80, 200, 100, 300], vibrateEnabled);
        triggerWinnerConfetti();

        setWinnerResults((prev) => [
          ...prev,
          { place: item.place, number: item.number, userId: item.userId, timestamp: Date.now() },
        ]);
        setPhase('winner_revealed');
      }
    }
  };

  // Spectacular Confetti for winners
  const triggerWinnerConfetti = () => {
    try {
      let fire: ((opts?: confetti.Options) => Promise<any> | null | void) | null = null;
      if (confettiCanvasRef.current) {
        fire = confetti.create(confettiCanvasRef.current, {
          resize: true,
          useWorker: true,
        });
      } else {
        fire = confetti;
      }
      if (!fire) return;

      const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#3b82f6', '#fbbf24'];

      // Center explosion
      fire({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.55 },
        colors,
        zIndex: 9999999,
      });

      // Side fireworks
      fire({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.65 },
        colors,
        zIndex: 9999999,
      });
      fire({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.65 },
        colors,
        zIndex: 9999999,
      });

      const end = Date.now() + 2500;
      const interval: number = window.setInterval(() => {
        if (!fire || Date.now() > end) {
          clearInterval(interval);
          return;
        }
        fire({
          particleCount: 25,
          startVelocity: 25,
          spread: 360,
          ticks: 70,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors,
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  // Continue to next step in draw sequence
  const handleContinue = () => {
    const seq = precomputedSequenceRef.current;
    if (!seq) return;

    if (currentRoundType === 'disqualified') {
      const alreadyRevealed = disqualifiedResults.length;
      if (alreadyRevealed < seq.disqualified.length) {
        startRolling('disqualified', alreadyRevealed);
      } else {
        startRolling('winner', 0);
      }
    } else {
      const alreadyRevealedWinners = winnerResults.length;
      if (alreadyRevealedWinners < seq.winners.length) {
        startRolling('winner', alreadyRevealedWinners);
      } else {
        finishDrawDirectToOfficialResults();
      }
    }
  };

  // Direct transition to official results (per user requirement)
  const finishDrawDirectToOfficialResults = async () => {
    const completedData: CompletedDraw = {
      drawDate: Date.now(),
      totalAssignedParticipating: participatingNumbers.length,
      disqualified: disqualifiedResults,
      winners: winnerResults,
    };

    const completedRaffle: Raffle = {
      ...raffle,
      status: 'completed',
      completedDraw: completedData,
    };

    onDrawCompleted(completedRaffle);
    await exitLandscapeMode();
    onClose();
  };

  // Helpers to fetch user objects
  const getUserById = (userId: string): AppUser => {
    return (
      allUsers.find((u) => u.id === userId) || {
        id: userId,
        name: 'Participante',
        gender: 'hombre',
        photoUrl: '',
        createdAt: Date.now(),
      }
    );
  };

  const activeDisqualifiedItem =
    phase === 'disqualified_revealed' && disqualifiedResults.length > 0
      ? disqualifiedResults[disqualifiedResults.length - 1]
      : null;
  const activeDisqualifiedUser = activeDisqualifiedItem ? getUserById(activeDisqualifiedItem.userId) : null;

  const activeWinnerItem =
    phase === 'winner_revealed' && winnerResults.length > 0
      ? winnerResults[winnerResults.length - 1]
      : null;
  const activeWinnerUser = activeWinnerItem ? getUserById(activeWinnerItem.userId) : null;

  const seq = precomputedSequenceRef.current;
  const totalDisqualifiedPlanned = seq?.disqualified.length || 0;
  const totalWinnersPlanned = seq?.winners.length || 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 ${
        phase !== 'config'
          ? forceRotate90
            ? 'arena-forced-landscape'
            : 'arena-natural-landscape'
          : 'p-4 overflow-y-auto'
      }`}
    >
      {/* Dedicated canvas for celebration confetti inside live arena */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full z-40"
      />

      {/* Sound & Screen Controls Floating Bar in Live Arena */}
      {phase !== 'config' && (
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 backdrop-blur-md transition shadow-lg"
            title={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Fullscreen toggle button */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 backdrop-blur-md transition shadow-lg"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-indigo-400" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Manual 90deg orientation override button */}
          <button
            onClick={() => setForceRotate90(!forceRotate90)}
            className={`p-2 rounded-xl border backdrop-blur-md transition shadow-lg flex items-center gap-1 ${
              forceRotate90
                ? 'bg-indigo-600/90 border-indigo-500 text-white'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title="Girar orientación 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Exit / Return */}
          <button
            onClick={handleReturnToHome}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 backdrop-blur-md transition shadow-lg"
            title="Salir del sorteo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STAGE 0: SETUP CONFIGURATION MODAL                   */}
      {/* ---------------------------------------------------- */}
      {phase === 'config' && (
        <div className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative mx-auto my-auto animate-in fade-in transition-colors box-border">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate">Iniciar Sorteo en Vivo</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Rifa: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{raffle.name}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleStartDrawSetup} className="mt-4 sm:mt-5 space-y-4">
            {/* Informative Stats */}
            <div className="grid grid-cols-3 gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Total Rifa</span>
                <span className="font-mono text-sm sm:text-base font-bold text-slate-800 dark:text-slate-300">{raffle.totalNumbers}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Participando</span>
                <span className="font-mono text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">{participatingNumbers.length} boletos</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Usuarios</span>
                <span className="font-mono text-sm sm:text-base font-bold text-pink-600 dark:text-pink-400">{uniqueUsersCount} pers.</span>
              </div>
            </div>

            {uniqueUsersCount === 1 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                ⭐ <strong>Solo hay 1 usuario con boletos:</strong> Automáticamente será el ganador de los lugares seleccionados.
              </div>
            )}

            {/* Input 1: Disqualified Count with Stepper & Numeric Keypad */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descalificados antes del ganador
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Máximo: {Math.max(0, participatingNumbers.length - 1)}
                </span>
              </div>

              {/* Stepper with - and +: responsive and contained */}
              <div className="flex items-center gap-2 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => changeDisqualified(-1)}
                  disabled={parsedDisqualified <= 0}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold text-base flex items-center justify-center transition shrink-0 border border-slate-200 dark:border-slate-700"
                  title="Disminuir descalificados"
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={disqualifiedInput}
                  onChange={(e) => {
                    setConfigError(null);
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setDisqualifiedInput(val);
                  }}
                  onBlur={() => {
                    if (disqualifiedInput === '') {
                      setDisqualifiedInput('0');
                    } else {
                      const val = parseInt(disqualifiedInput, 10);
                      const max = Math.max(0, participatingNumbers.length - 1);
                      setDisqualifiedInput(String(Math.min(max, Math.max(0, val))));
                    }
                  }}
                  className="w-full min-w-0 flex-1 text-center py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="0"
                />

                <button
                  type="button"
                  onClick={() => changeDisqualified(1)}
                  disabled={parsedDisqualified >= participatingNumbers.length - 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold text-base flex items-center justify-center transition shrink-0 border border-slate-200 dark:border-slate-700"
                  title="Aumentar descalificados"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Quick Presets for Disqualified: 0, 1, 3, 5, 10 */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Rápidos:</span>
                {[0, 1, 3, 5, 10].map((qty) => {
                  const maxAllowed = Math.max(0, participatingNumbers.length - 1);
                  const isExceeded = qty > maxAllowed;
                  const isSelected = parsedDisqualified === qty && disqualifiedInput !== '';
                  return (
                    <button
                      type="button"
                      key={qty}
                      disabled={isExceeded}
                      onClick={() => setDisqualifiedInput(String(Math.min(qty, maxAllowed)))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isExceeded
                          ? 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 text-slate-400 border border-slate-200/50 dark:border-slate-800'
                          : isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {qty}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input 2: Winner Count with Stepper & Numeric Keypad */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Cantidad de Ganadores *
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Máximo: {Math.min(10, participatingNumbers.length)}
                </span>
              </div>

              {/* Stepper with - and +: responsive and contained */}
              <div className="flex items-center gap-2 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => changeWinners(-1)}
                  disabled={parsedWinners <= 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold text-base flex items-center justify-center transition shrink-0 border border-slate-200 dark:border-slate-700"
                  title="Disminuir ganadores"
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={winnerInput}
                  onChange={(e) => {
                    setConfigError(null);
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setWinnerInput(val);
                  }}
                  onBlur={() => {
                    if (winnerInput === '') {
                      setWinnerInput('1');
                    } else {
                      const val = parseInt(winnerInput, 10);
                      const max = Math.min(10, participatingNumbers.length);
                      setWinnerInput(String(Math.min(max, Math.max(1, val))));
                    }
                  }}
                  className="w-full min-w-0 flex-1 text-center py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="1"
                />

                <button
                  type="button"
                  onClick={() => changeWinners(1)}
                  disabled={parsedWinners >= Math.min(10, participatingNumbers.length)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold text-base flex items-center justify-center transition shrink-0 border border-slate-200 dark:border-slate-700"
                  title="Aumentar ganadores"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Quick Presets for Winners: 1, 2, 3, 5, 10 */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Rápidos:</span>
                {[1, 2, 3, 5, 10].map((qty) => {
                  const maxAllowed = Math.min(10, participatingNumbers.length);
                  const isExceeded = qty > maxAllowed;
                  const isSelected = parsedWinners === qty && winnerInput !== '';
                  return (
                    <button
                      type="button"
                      key={qty}
                      disabled={isExceeded}
                      onClick={() => setWinnerInput(String(Math.min(qty, maxAllowed)))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isExceeded
                          ? 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 text-slate-400 border border-slate-200/50 dark:border-slate-800'
                          : isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {qty}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orientation & Fullscreen Info Callout */}
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-pink-500" />
              <span>
                La ruleta se ejecutará en <strong>modo horizontal y pantalla completa</strong> ocultando la barra del sistema.
              </span>
            </div>

            {configError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={participatingNumbers.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 disabled:opacity-50 text-sm font-bold text-white shadow-xl flex items-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                Iniciar Sorteo en Vivo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STAGE 1: COUNTDOWN PHASE (COMPACT FOR LANDSCAPE)      */}
      {/* ---------------------------------------------------- */}
      {phase === 'countdown' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none animate-in zoom-in-75 duration-300">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Sorteo en Vivo · Modo Horizontal</span>
          </div>

          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-900/90 border-4 border-indigo-500/40 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <span className="font-mono text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300">
              {countdownNum}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-4 font-semibold animate-pulse">
            {countdownNum === 0 ? '¡ARRANCA LA RULETA!' : '¡Mucha suerte a todos los participantes!'}
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STAGE 2: ROLLING NUMBERS PHASE (COMPACT LANDSCAPE)    */}
      {/* ---------------------------------------------------- */}
      {phase === 'rolling' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-3 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            {currentRoundType === 'disqualified'
              ? `Buscando Descalificado #${currentRoundIndex + 1} de ${totalDisqualifiedPlanned}`
              : `Buscando Ganador: ${currentRoundIndex + 1}º Lugar de ${totalWinnersPlanned}`}
          </div>

          {/* Rolling Number Billboard */}
          <div className="relative px-8 py-4 sm:px-14 sm:py-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 animate-neon max-w-xl w-full">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-mono">
              RULETA EN VIVO · PANTALLA COMPLETA
            </div>
            <div className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-pink-400 to-amber-300">
              #{rollingDisplayNumber}
            </div>
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-400 mt-3 font-medium">
            Girando durante 5 segundos... la emoción al máximo.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STAGE 3: DISQUALIFIED NUMBER REVEALED                */}
      {/* ---------------------------------------------------- */}
      {phase === 'disqualified_revealed' && activeDisqualifiedItem && activeDisqualifiedUser && (
        <div className="w-full max-w-xl px-4 py-2 flex flex-col items-center text-center animate-in zoom-in-90 duration-300 select-none">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Descalificado #{activeDisqualifiedItem.order} de {totalDisqualifiedPlanned}
            </span>
          </div>

          <div className="font-mono text-5xl sm:text-6xl font-black text-rose-400 my-0.5">
            #{activeDisqualifiedItem.number}
          </div>

          {/* User Card */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 my-2 max-w-sm w-full shadow-lg">
            <UserAvatar
              photoUrl={activeDisqualifiedUser.photoUrl}
              name={activeDisqualifiedUser.name}
              gender={activeDisqualifiedUser.gender}
              size="md"
            />
            <div className="text-left min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-100 block truncate">{activeDisqualifiedUser.name}</span>
              <span className="text-xs text-slate-400">{activeDisqualifiedUser.phone || 'Participante'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-md bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl mb-3">
            "{activeDisqualifiedItem.message}"
          </p>

          <button
            onClick={handleContinue}
            className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 active:scale-95 transition"
          >
            <span>
              {disqualifiedResults.length < totalDisqualifiedPlanned
                ? `Continuar Siguiente Descalificado (${disqualifiedResults.length + 1}/${totalDisqualifiedPlanned})`
                : 'Ir a los Boletos Ganadores'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STAGE 4: WINNER NUMBER REVEALED                      */}
      {/* ---------------------------------------------------- */}
      {phase === 'winner_revealed' && activeWinnerItem && activeWinnerUser && (
        <div className="w-full max-w-xl px-4 py-2 flex flex-col items-center text-center animate-in zoom-in-90 duration-300 select-none">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
              🏆 {activeWinnerItem.place}º Lugar Ganador
            </span>
          </div>

          <div className="font-mono text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-lg my-0.5">
            #{activeWinnerItem.number}
          </div>

          {/* Winner Profile Card */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 my-2 max-w-sm w-full shadow-2xl">
            <UserAvatar
              photoUrl={activeWinnerUser.photoUrl}
              name={activeWinnerUser.name}
              gender={activeWinnerUser.gender}
              size="lg"
            />
            <div className="text-left min-w-0 flex-1">
              <span className="text-sm font-extrabold text-amber-200 block truncate">{activeWinnerUser.name}</span>
              <span className="text-xs text-slate-400">{activeWinnerUser.phone || 'Ganador'}</span>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                ¡Boleto Premiado #{activeWinnerItem.number}!
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-200 mb-3">
            ¡Muchas felicidades a {activeWinnerUser.name} por este gran triunfo! 🎉
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {winnerResults.length < totalWinnersPlanned ? (
              <button
                onClick={handleContinue}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 active:scale-95 transition"
              >
                <span>Siguiente Ganador ({winnerResults.length + 1} de {totalWinnersPlanned})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              /* Direct to official results per user requirement */
              <button
                onClick={finishDrawDirectToOfficialResults}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-2xl flex items-center gap-2 active:scale-95 transition"
              >
                <Award className="w-5 h-5" />
                <span>Finalizar y Ver Resultados Oficiales</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
