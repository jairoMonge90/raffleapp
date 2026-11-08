import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Raffle, AppUser } from './types';
import { storage, AppSettings, AppTheme } from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { RaffleDetailView } from './views/RaffleDetailView';
import { SettingsView } from './views/SettingsView';
import { CreateRaffleModal } from './components/CreateRaffleModal';
import { CreateUserModal } from './components/CreateUserModal';
import { AcquireNumbersModal } from './components/AcquireNumbersModal';
import { UserDetailModal } from './components/UserDetailModal';
import { LiveDrawModal } from './components/LiveDrawModal';
import { CheckCircle2, AlertCircle, X, Sparkles, Trophy } from 'lucide-react';
import { soundEffects } from './utils/sound';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export default function App() {
  // Global State
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [correlative, setCorrelative] = useState<number>(1);
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Navigation & Active views
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(null);

  // Modals state
  const [isCreateRaffleOpen, setIsCreateRaffleOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isAcquireNumbersOpen, setIsAcquireNumbersOpen] = useState(false);
  const [preselectedUserIdForAcquire, setPreselectedUserIdForAcquire] = useState<string | undefined>();
  
  // User detail inspection inside active raffle
  const [inspectingUser, setInspectingUser] = useState<{
    user: AppUser;
    numbers: number[];
  } | null>(null);

  // Live Draw Modal
  const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);
  const [drawingRaffle, setDrawingRaffle] = useState<Raffle | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Online status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Synchronize Dark / Light / System Theme with document element
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: AppTheme) => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(settings.theme || 'dark');

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Load data on startup
  useEffect(() => {
    const loadedUsers = storage.getUsers();
    const loadedRaffles = storage.getRaffles();
    const loadedCorrelative = storage.getCorrelative();
    const loadedSettings = storage.getSettings();

    setUsers(loadedUsers);
    setRaffles(loadedRaffles);
    setCorrelative(loadedCorrelative);
    setSettings(loadedSettings);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type === 'error') {
      soundEffects.playDisqualified(settings.soundEnabled);
      soundEffects.vibrate([60], settings.vibrateEnabled);
    } else {
      soundEffects.playSuccessChime(settings.soundEnabled);
      soundEffects.vibrate([40, 30, 40], settings.vibrateEnabled);
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [settings.soundEnabled, settings.vibrateEnabled]);

  // Currently viewed raffle
  const selectedRaffle = useMemo(() => {
    return raffles.find((r) => r.id === selectedRaffleId) || null;
  }, [raffles, selectedRaffleId]);

  // First active raffle available for quick draw
  const activeRaffles = useMemo(() => {
    return raffles.filter((r) => r.status === 'active');
  }, [raffles]);

  // Can start draw if there is at least one active raffle with assignments
  const canStartDraw = useMemo(() => {
    if (selectedRaffle && selectedRaffle.status === 'active') {
      return selectedRaffle.assignments.some((a) => a.assignedNumbers.length > 0);
    }
    return activeRaffles.some((r) => r.assignments.some((a) => a.assignedNumbers.length > 0));
  }, [selectedRaffle, activeRaffles]);

  // Handle center "Iniciar Sorteo" button press
  const handleInitiateDraw = () => {
    let target = selectedRaffle && selectedRaffle.status === 'active' ? selectedRaffle : null;
    if (!target) {
      target = activeRaffles.find((r) => r.assignments.some((a) => a.assignedNumbers.length > 0)) || null;
    }

    if (!target) {
      if (activeRaffles.length === 0) {
        showToast('No tienes ningún sorteo activo. Crea uno primero.', 'error');
        setIsCreateRaffleOpen(true);
      } else {
        showToast('Debes asignar números a participantes antes de iniciar el sorteo.', 'error');
        setSelectedRaffleId(activeRaffles[0].id);
        setActiveTab('home');
      }
      return;
    }

    const assignedCount = target.assignments.reduce((sum, a) => sum + a.assignedNumbers.length, 0);
    if (assignedCount === 0) {
      showToast('Esta rifa no tiene números asignados para sortear.', 'error');
      setSelectedRaffleId(target.id);
      setActiveTab('home');
      return;
    }

    setDrawingRaffle(target);
    setIsLiveDrawOpen(true);
  };

  // Specific raffle draw start
  const handleStartDrawForSpecificRaffle = (raffle: Raffle) => {
    const assignedCount = raffle.assignments.reduce((sum, a) => sum + a.assignedNumbers.length, 0);
    if (assignedCount === 0) {
      showToast('Debes asignar boletos a usuarios antes de sortear.', 'error');
      setSelectedRaffleId(raffle.id);
      setIsAcquireNumbersOpen(true);
      return;
    }
    setDrawingRaffle(raffle);
    setIsLiveDrawOpen(true);
  };

  // Create Raffle Handler
  const handleRaffleCreated = (newRaffle: Raffle) => {
    const updated = [newRaffle, ...raffles];
    setRaffles(updated);
    storage.saveRaffles(updated);

    const nextCorr = correlative + 1;
    setCorrelative(nextCorr);
    storage.saveCorrelative(nextCorr);

    setSelectedRaffleId(newRaffle.id);
    setActiveTab('home');
    showToast(`Sorteo ${newRaffle.name} creado exitosamente.`);
  };

  // Create User Handler
  const handleUserCreated = (newUser: AppUser) => {
    const updated = [newUser, ...users];
    setUsers(updated);
    storage.saveUsers(updated);
    showToast(`Usuario ${newUser.name} creado con éxito.`);
    setPreselectedUserIdForAcquire(newUser.id);
  };

  // Assign Numbers to User
  const handleAssignNumbers = (userId: string, count: number): { assigned: number[]; user: AppUser } => {
    if (!selectedRaffle) throw new Error('No raffle selected');

    // Calculate occupied numbers
    const occupied = new Set<number>();
    selectedRaffle.assignments.forEach((a) => a.assignedNumbers.forEach((n) => occupied.add(n)));

    // Available numbers array
    const available: number[] = [];
    for (let i = 1; i <= selectedRaffle.totalNumbers; i++) {
      if (!occupied.has(i)) available.push(i);
    }

    // Shuffle and pick `count` numbers
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const assigned = available.slice(0, count);

    // Update assignment in raffle
    const currentAssignments = [...selectedRaffle.assignments];
    const existingIndex = currentAssignments.findIndex((a) => a.userId === userId);

    if (existingIndex >= 0) {
      currentAssignments[existingIndex] = {
        ...currentAssignments[existingIndex],
        assignedNumbers: [...currentAssignments[existingIndex].assignedNumbers, ...assigned],
      };
    } else {
      currentAssignments.push({
        userId,
        assignedNumbers: assigned,
      });
    }

    const updatedRaffle: Raffle = {
      ...selectedRaffle,
      assignments: currentAssignments,
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    setRaffles(newRaffles);
    storage.saveRaffles(newRaffles);

    const targetUser = users.find((u) => u.id === userId)!;
    showToast(`Se han adquirido ${assigned.length} números para ${targetUser.name}`);

    // If inspecting user was open, sync its numbers
    if (inspectingUser && inspectingUser.user.id === userId) {
      const updatedUserNumbers =
        currentAssignments.find((a) => a.userId === userId)?.assignedNumbers || [];
      setInspectingUser({
        user: inspectingUser.user,
        numbers: updatedUserNumbers,
      });
    }

    return { assigned, user: targetUser };
  };

  // Acquire more from UserDetail modal
  const handleAcquireMoreForInspectingUser = (count: number): number[] => {
    if (!inspectingUser) return [];
    const res = handleAssignNumbers(inspectingUser.user.id, count);
    return res.assigned;
  };

  // Return numbers from UserDetail modal
  const handleReturnNumbersForInspectingUser = (
    count: number
  ): { returned: number[]; removedCompletely: boolean } => {
    if (!inspectingUser || !selectedRaffle) return { returned: [], removedCompletely: false };

    const assignment = selectedRaffle.assignments.find((a) => a.userId === inspectingUser.user.id);
    if (!assignment) return { returned: [], removedCompletely: false };

    const currentNumbers = [...assignment.assignedNumbers];
    const returnedNumbers = currentNumbers.splice(0, count);

    let updatedAssignments: typeof selectedRaffle.assignments;
    let removedCompletely = false;

    if (currentNumbers.length === 0) {
      // User returned all numbers: "si el usuario devuelve todos los numeros, su nombre será borrado de la lista de usuarios de la rifa actual"
      updatedAssignments = selectedRaffle.assignments.filter(
        (a) => a.userId !== inspectingUser.user.id
      );
      removedCompletely = true;
    } else {
      updatedAssignments = selectedRaffle.assignments.map((a) =>
        a.userId === inspectingUser.user.id ? { ...a, assignedNumbers: currentNumbers } : a
      );
    }

    const updatedRaffle: Raffle = {
      ...selectedRaffle,
      assignments: updatedAssignments,
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    setRaffles(newRaffles);
    storage.saveRaffles(newRaffles);

    if (removedCompletely) {
      showToast(
        `${inspectingUser.user.name} devolvió todos sus boletos y fue retirado de la rifa.`
      );
      setInspectingUser(null);
    } else {
      showToast(`Se devolvieron ${returnedNumbers.length} números con éxito.`);
      setInspectingUser({
        user: inspectingUser.user,
        numbers: currentNumbers,
      });
    }

    return { returned: returnedNumbers, removedCompletely };
  };

  // Complete Draw Handler
  const handleDrawCompleted = (completedRaffle: Raffle) => {
    const newRaffles = raffles.map((r) => (r.id === completedRaffle.id ? completedRaffle : r));
    setRaffles(newRaffles);
    storage.saveRaffles(newRaffles);
    setSelectedRaffleId(completedRaffle.id);
    showToast(`¡Sorteo ${completedRaffle.name} completado con éxito!`);
  };

  // Delete User Handler
  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    storage.saveUsers(updated);
    showToast('Usuario eliminado del directorio.');
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    showToast('Preferencias actualizadas.');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const data = {
      users,
      raffles,
      correlative,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raffleapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada.');
  };

  // Import JSON Backup
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed.users) && Array.isArray(parsed.raffles)) {
          setUsers(parsed.users);
          setRaffles(parsed.raffles);
          setCorrelative(parsed.correlative || parsed.raffles.length + 1);
          storage.saveUsers(parsed.users);
          storage.saveRaffles(parsed.raffles);
          storage.saveCorrelative(parsed.correlative || parsed.raffles.length + 1);
          showToast('Datos restaurados correctamente.');
        } else {
          showToast('El archivo de respaldo no tiene el formato válido.', 'error');
        }
      } catch {
        showToast('Error al leer el archivo de copia de seguridad.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('¿Deseas restablecer los datos a los sorteos y usuarios de demostración?')) {
      storage.resetAllData();
      const freshUsers = storage.getUsers();
      const freshRaffles = storage.getRaffles();
      const freshCorr = storage.getCorrelative();
      setUsers(freshUsers);
      setRaffles(freshRaffles);
      setCorrelative(freshCorr);
      setSelectedRaffleId(null);
      showToast('Datos restablecidos a la configuración de demostración.');
    }
  };

  // Dynamic center button mode: 'create' in list of raffles, 'draw' in active raffle view
  const isInsideRaffle = Boolean(selectedRaffle && activeTab === 'home');
  const centerMode: 'create' | 'draw' = isInsideRaffle && selectedRaffle?.status === 'active' ? 'draw' : 'create';

  const handleCenterAction = () => {
    if (centerMode === 'create') {
      setIsCreateRaffleOpen(true);
    } else if (selectedRaffle) {
      const assignedCount = selectedRaffle.assignments.reduce(
        (sum, a) => sum + a.assignedNumbers.length,
        0
      );
      if (assignedCount === 0) {
        showToast('Debes asignar números a participantes antes de iniciar el sorteo.', 'error');
        setIsAcquireNumbersOpen(true);
      } else {
        handleStartDrawForSpecificRaffle(selectedRaffle);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'settings') setSelectedRaffleId(null);
        }}
        centerMode={centerMode}
        onCenterClick={handleCenterAction}
        canPerformCenterAction={true}
        isOnline={isOnline}
        language={settings.language}
      />

      {/* Main Content Container (Mobile-first with full 1440px desktop presence) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeTab === 'settings' ? (
          <SettingsView
            allUsers={users}
            raffles={raffles}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenCreateUser={() => setIsCreateUserOpen(true)}
            onDeleteUser={handleDeleteUser}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetData={handleResetData}
          />
        ) : selectedRaffle ? (
          <RaffleDetailView
            raffle={selectedRaffle}
            allUsers={users}
            onBack={() => setSelectedRaffleId(null)}
            onOpenAcquireModal={() => setIsAcquireNumbersOpen(true)}
            onOpenCreateUserModal={() => setIsCreateUserOpen(true)}
            onSelectUserDetail={(user, numbers) => setInspectingUser({ user, numbers })}
            onStartDraw={handleStartDrawForSpecificRaffle}
            language={settings.language}
          />
        ) : (
          <HomeView
            raffles={raffles}
            allUsers={users}
            onSelectRaffle={(raffle) => setSelectedRaffleId(raffle.id)}
            onOpenCreateRaffle={() => setIsCreateRaffleOpen(true)}
            onStartDrawForRaffle={handleStartDrawForSpecificRaffle}
            language={settings.language}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Create Raffle Modal */}
      <CreateRaffleModal
        isOpen={isCreateRaffleOpen}
        onClose={() => setIsCreateRaffleOpen(false)}
        nextCorrelative={correlative}
        onRaffleCreated={handleRaffleCreated}
      />

      {/* 2. Acquire Numbers Modal */}
      {selectedRaffle && (
        <AcquireNumbersModal
          isOpen={isAcquireNumbersOpen}
          onClose={() => {
            setIsAcquireNumbersOpen(false);
            setPreselectedUserIdForAcquire(undefined);
          }}
          raffle={selectedRaffle}
          allUsers={users}
          preselectedUserId={preselectedUserIdForAcquire}
          onOpenCreateUser={() => setIsCreateUserOpen(true)}
          onAssignNumbers={handleAssignNumbers}
        />
      )}

      {/* 3. Create User Modal (rendered with z-[70] and after AcquireNumbersModal so it stays strictly on top) */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* 4. User Detail / History Modal */}
      {selectedRaffle && inspectingUser && (
        <UserDetailModal
          isOpen={Boolean(inspectingUser)}
          onClose={() => setInspectingUser(null)}
          user={inspectingUser.user}
          raffle={selectedRaffle}
          userNumbers={inspectingUser.numbers}
          availableCount={
            selectedRaffle.totalNumbers -
            selectedRaffle.assignments.reduce((sum, a) => sum + a.assignedNumbers.length, 0)
          }
          onAcquireMore={handleAcquireMoreForInspectingUser}
          onReturnNumbers={handleReturnNumbersForInspectingUser}
        />
      )}

      {/* 5. Live Draw Modal (Horizontal Landscape Arena) */}
      {drawingRaffle && (
        <LiveDrawModal
          isOpen={isLiveDrawOpen}
          onClose={() => {
            setIsLiveDrawOpen(false);
            setDrawingRaffle(null);
          }}
          raffle={drawingRaffle}
          allUsers={users}
          onDrawCompleted={handleDrawCompleted}
          soundEnabled={settings.soundEnabled}
          vibrateEnabled={settings.vibrateEnabled}
        />
      )}

      {/* Toast Notifications (Modern, Glassmorphic & Centered safely below the notch) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-md pointer-events-none"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3.5 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-semibold animate-in slide-in-from-top-3 fade-in duration-300 border ${
              toast.type === 'error'
                ? 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border-rose-400/40 dark:border-rose-500/40 shadow-rose-500/10 ring-1 ring-rose-400/20'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border-emerald-400/40 dark:border-emerald-500/40 shadow-emerald-500/10 ring-1 ring-emerald-400/20'
            }`}
          >
            {/* Visual Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                toast.type === 'error'
                  ? 'bg-rose-500 text-white shadow-rose-500/25'
                  : 'bg-emerald-500 text-white shadow-emerald-500/25'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block leading-none mb-1 ${
                  toast.type === 'error'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {toast.type === 'error' ? 'Aviso' : 'Notificación'}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-snug break-words">
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
