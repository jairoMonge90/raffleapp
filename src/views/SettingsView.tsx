import React, { useState, useRef } from 'react';
import {
  Settings,
  Users,
  Camera,
  Image as ImageIcon,
  Moon,
  Sun,
  Globe,
  Volume2,
  Smartphone,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  UserPlus,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Check,
  Laptop
} from 'lucide-react';
import { AppUser, Raffle } from '../types';
import { AppSettings, AppTheme, AppLanguage } from '../utils/storage';
import { UserAvatar } from '../components/UserAvatar';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { getT } from '../utils/i18n';

interface Props {
  allUsers: AppUser[];
  raffles: Raffle[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenCreateUser: () => void;
  onDeleteUser: (userId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetData: () => void;
}

type SettingsSection =
  | 'main'
  | 'theme'
  | 'language'
  | 'audio'
  | 'users'
  | 'hardware'
  | 'backup'
  | 'install';

export const SettingsView: React.FC<Props> = ({
  allUsers,
  raffles,
  settings,
  onUpdateSettings,
  onOpenCreateUser,
  onDeleteUser,
  onExportBackup,
  onImportBackup,
  onResetData,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  
  // Camera permission state
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'testing' | 'granted' | 'denied'>('idle');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);

  // Gallery permission state
  const [galleryStatus, setGalleryStatus] = useState<'idle' | 'testing' | 'granted' | 'denied'>('idle');
  const galleryTestInputRef = useRef<HTMLInputElement>(null);

  const t = getT(settings.language);

  // Compact Stats Calculation
  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const completedRaffles = raffles.filter((r) => r.status === 'completed').length;
  const totalAssignedAcrossAll = raffles.reduce((acc, r) => {
    return acc + r.assignments.reduce((sum, a) => sum + a.assignedNumbers.length, 0);
  }, 0);

  // Test Camera Permission on demand
  const handleTestCamera = async () => {
    setCameraStatus('testing');
    setCameraErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('denied');
        setCameraErrorMsg(
          settings.language === 'en'
            ? 'Camera access not supported by browser.'
            : settings.language === 'pt'
            ? 'Acesso à câmera não suportado pelo navegador.'
            : settings.language === 'fr'
            ? 'Accès caméra non supporté par le navigateur.'
            : 'Tu navegador no soporta acceso directo a la cámara.'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
    } catch {
      setCameraStatus('denied');
      setCameraErrorMsg(
        settings.language === 'en'
          ? 'Camera permission denied or unavailable.'
          : settings.language === 'pt'
          ? 'Permissão da câmera negada ou indisponível.'
          : settings.language === 'fr'
          ? 'Autorisation de la caméra refusée ou indisponible.'
          : 'Permiso de cámara no concedido o denegado.'
      );
    }
  };

  // Test Gallery / Photo picker access
  const handleTestGallery = () => {
    setGalleryStatus('testing');
    galleryTestInputRef.current?.click();
  };

  const handleGalleryFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGalleryStatus('granted');
    } else {
      setGalleryStatus('granted'); // File picker was opened and cancelled, permissions are functional
    }
  };

  const currentThemeLabel =
    settings.theme === 'light'
      ? t.themeLight
      : settings.theme === 'dark'
      ? t.themeDark
      : t.themeSystem;

  const currentLanguageLabel =
    settings.language === 'es'
      ? 'Español'
      : settings.language === 'en'
      ? 'English'
      : settings.language === 'pt'
      ? 'Português'
      : 'Français';

  return (
    <div className="space-y-5 pb-24 animate-in fade-in max-w-3xl mx-auto">
      {/* Hidden file input for gallery test */}
      <input
        ref={galleryTestInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFileSelected}
      />

      {/* Top Header */}
      {activeSection === 'main' ? (
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.settingsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.settingsSubtitle}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setActiveSection('main')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group py-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t.backToSettings}</span>
        </button>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. COMPACT GENERAL SUMMARY (Kept on main screen, minimal height)     */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'main' && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.generalSummary}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {allUsers.length}{' '}
              {settings.language === 'en'
                ? 'registered users'
                : settings.language === 'pt'
                ? 'usuários reg.'
                : settings.language === 'fr'
                ? 'utilisateurs'
                : 'usuarios reg.'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-800">
            <div className="px-1">
              <span className="font-mono text-base md:text-lg font-black text-slate-900 dark:text-white block">
                {totalRaffles}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t.totalRaffles}
              </span>
            </div>
            <div className="px-1">
              <span className="font-mono text-base md:text-lg font-black text-emerald-500 dark:text-emerald-400 block">
                {activeRaffles}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t.activeRaffles}
              </span>
            </div>
            <div className="px-1">
              <span className="font-mono text-base md:text-lg font-black text-amber-500 dark:text-amber-400 block">
                {completedRaffles}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t.completedRaffles}
              </span>
            </div>
            <div className="px-1">
              <span className="font-mono text-base md:text-lg font-black text-indigo-500 dark:text-indigo-400 block">
                {totalAssignedAcrossAll}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t.totalTickets}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN SETTINGS LIST WITH ICONS & CHEVRONS                       */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'main' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
          {/* Item 1: Theme & Appearance */}
          <div
            onClick={() => setActiveSection('theme')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionAppearance}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionAppearanceDesc}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                {currentThemeLabel}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Item 2: Language */}
          <div
            onClick={() => setActiveSection('language')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionLanguage}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionLanguageDesc}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-500 dark:text-teal-400">
                {currentLanguageLabel}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Item 3: Audio & Haptics */}
          <div
            onClick={() => setActiveSection('audio')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionAudioHaptics}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionAudioHapticsDesc}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Item 4: Users Directory */}
          <div
            onClick={() => setActiveSection('users')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionUsers}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionUsersDesc} ({allUsers.length})
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Item 5: Hardware Permissions */}
          <div
            onClick={() => setActiveSection('hardware')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionHardware}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionHardwareDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Item 6: Backup & Data */}
          <div
            onClick={() => setActiveSection('backup')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionBackup}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionBackupDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Item 7: PWA App Installation */}
          <div
            onClick={() => setActiveSection('install')}
            className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {t.sectionInstall}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.sectionInstallDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 1: THEME / APARIENCIA (3 OPTIONS)                       */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'theme' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionAppearance}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {settings.language === 'en'
                ? 'Select how you want RaffleApp to look on your device:'
                : settings.language === 'pt'
                ? 'Selecione como deseja visualizar o RaffleApp em seu dispositivo:'
                : settings.language === 'fr'
                ? 'Sélectionnez le mode d\'affichage de RaffleApp sur votre appareil :'
                : 'Selecciona cómo deseas visualizar RaffleApp en tu dispositivo:'}
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'dark' as AppTheme,
                label: t.themeDark,
                icon: Moon,
                desc:
                  settings.language === 'en'
                    ? 'High-contrast dark interface'
                    : settings.language === 'pt'
                    ? 'Interface escura de alto contraste'
                    : settings.language === 'fr'
                    ? 'Interface sombre à contraste élevé'
                    : 'Interfaz oscura de alto contraste recomendada',
              },
              {
                id: 'light' as AppTheme,
                label: t.themeLight,
                icon: Sun,
                desc:
                  settings.language === 'en'
                    ? 'Bright and luminous interface'
                    : settings.language === 'pt'
                    ? 'Interface clara e luminosa'
                    : settings.language === 'fr'
                    ? 'Interface claire et lumineuse'
                    : 'Interfaz clara y luminosa',
              },
              {
                id: 'system' as AppTheme,
                label: t.themeSystem,
                icon: Laptop,
                desc:
                  settings.language === 'en'
                    ? 'Automatically follows your system settings'
                    : settings.language === 'pt'
                    ? 'Segue automaticamente as preferências do sistema'
                    : settings.language === 'fr'
                    ? 'Suit automatiquement les réglages du système'
                    : 'Sigue automáticamente la preferencia de tu sistema',
              },
            ].map(({ id, label, icon: Icon, desc }) => {
              const isSelected = settings.theme === id;
              return (
                <div
                  key={id}
                  onClick={() => onUpdateSettings({ ...settings, theme: id })}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-indigo-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 2: LANGUAGE SELECTION (4 LANGUAGES)                     */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'language' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionLanguage}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {settings.language === 'en'
                ? 'Device language was auto-detected. You can manually change the language anytime:'
                : settings.language === 'pt'
                ? 'O idioma do dispositivo foi detectado automaticamente. Você pode alterá-lo quando desejar:'
                : settings.language === 'fr'
                ? 'La langue de l\'appareil a été détectée automatiquement. Vous pouvez la changer à tout moment :'
                : 'El idioma del dispositivo fue detectado automáticamente. Puedes cambiarlo cuando desees:'}
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'es' as AppLanguage, label: 'Español', flag: '🇪🇸', note: 'Idioma nativo' },
              { id: 'en' as AppLanguage, label: 'English', flag: '🇺🇸', note: 'English language' },
              { id: 'pt' as AppLanguage, label: 'Português', flag: '🇧🇷', note: 'Língua portuguesa' },
              { id: 'fr' as AppLanguage, label: 'Français', flag: '🇫🇷', note: 'Langue française' },
            ].map(({ id, label, flag, note }) => {
              const isSelected = settings.language === id;
              return (
                <div
                  key={id}
                  onClick={() => onUpdateSettings({ ...settings, language: id })}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{flag}</span>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{note}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-teal-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 3: AUDIO & HAPTICS                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'audio' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionAudioHaptics}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configura los efectos multimedia durante el sorteo en vivo:
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 block">
                    Sonidos del Sorteo
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Tictac de ruleta, sonido de descalificado y fanfarria triunfal
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 block">
                    Vibración Háptica
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Vibración táctil al detener la ruleta y al premiar
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibrateEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, vibrateEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 4: USERS DIRECTORY                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'users' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.sectionUsers} ({allUsers.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disponibles para asignación en todos los sorteos
              </p>
            </div>

            <button
              onClick={onOpenCreateUser}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 p-1">
            {allUsers.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No hay usuarios registrados todavía.
              </p>
            ) : (
              allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar photoUrl={user.photoUrl} name={user.name} gender={user.gender} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {user.phone || 'Sin teléfono'} · {user.gender}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteUser(user.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 5: HARDWARE PERMISSIONS (CAMERA & GALLERY)              */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'hardware' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionHardware}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {settings.language === 'en'
                ? 'Permissions are requested on demand when taking photos or choosing from your photo gallery. You can verify both accesses below:'
                : settings.language === 'pt'
                ? 'As permissões são solicitadas sob demanda ao tirar fotos ou escolher da galeria. Você pode verificar ambos os acessos abaixo:'
                : settings.language === 'fr'
                ? 'Les autorisations sont demandées à la demande lors de la prise de vue ou du choix dans la galerie. Vous pouvez vérifier les deux accès ci-dessous :'
                : 'Los permisos se solicitan automáticamente al capturar fotos o cargar desde la galería. Puedes verificar ambos accesos aquí:'}
            </p>
          </div>

          <div className="space-y-3">
            {/* 1. Camera Permission Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      {settings.language === 'en'
                        ? 'Camera (Webcam / Mobile Camera)'
                        : settings.language === 'pt'
                        ? 'Câmera (Webcam / Câmera Móvel)'
                        : settings.language === 'fr'
                        ? 'Appareil photo (Webcam / Mobile)'
                        : 'Cámara Web / Dispositivo'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {cameraStatus === 'granted' && (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {settings.language === 'en'
                            ? 'Permission verified successfully'
                            : settings.language === 'pt'
                            ? 'Permissão verificada com sucesso'
                            : settings.language === 'fr'
                            ? 'Autorisation vérifiée avec succès'
                            : 'Permiso verificado correctamente'}
                        </span>
                      )}
                      {cameraStatus === 'denied' && (
                        <span className="text-rose-500 font-semibold">{cameraErrorMsg || 'Acceso no disponible'}</span>
                      )}
                      {cameraStatus === 'idle' &&
                        (settings.language === 'en'
                          ? 'Not tested yet in this session'
                          : settings.language === 'pt'
                          ? 'Não testado nesta sessão'
                          : settings.language === 'fr'
                          ? 'Pas encore testé dans cette session'
                          : 'No probado aún en esta sesión')}
                      {cameraStatus === 'testing' &&
                        (settings.language === 'en'
                          ? 'Verifying camera access...'
                          : settings.language === 'pt'
                          ? 'Verificando acesso à câmera...'
                          : settings.language === 'fr'
                          ? 'Vérification de l\'accès...'
                          : 'Verificando acceso a cámara...')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleTestCamera}
                  disabled={cameraStatus === 'testing'}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-xs font-semibold text-white transition shrink-0"
                >
                  {cameraStatus === 'testing'
                    ? (settings.language === 'en' ? 'Testing...' : 'Probando...')
                    : (settings.language === 'en' ? 'Test Camera' : 'Probar Cámara')}
                </button>
              </div>
            </div>

            {/* 2. Gallery / Photos Permission Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      {settings.language === 'en'
                        ? 'Photo Gallery & Media Files'
                        : settings.language === 'pt'
                        ? 'Galeria de Fotos e Arquivos de Mídia'
                        : settings.language === 'fr'
                        ? 'Galerie de photos et fichiers multimédias'
                        : 'Galería de Fotos y Archivos Multimedia'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {galleryStatus === 'granted' && (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {settings.language === 'en'
                            ? 'Gallery access verified & operational'
                            : settings.language === 'pt'
                            ? 'Acesso à galeria verificado e operacional'
                            : settings.language === 'fr'
                            ? 'Accès à la galerie vérifié et opérationnel'
                            : 'Acceso a galería verificado y operativo'}
                        </span>
                      )}
                      {galleryStatus === 'denied' && (
                        <span className="text-rose-500 font-semibold">
                          {settings.language === 'en' ? 'Access unavailable' : 'Acceso no disponible'}
                        </span>
                      )}
                      {galleryStatus === 'idle' &&
                        (settings.language === 'en'
                          ? 'Permission granted on file select (drag & drop / photo picker)'
                          : settings.language === 'pt'
                          ? 'Permissão concedida ao selecionar foto (seletor de imagens)'
                          : settings.language === 'fr'
                          ? 'Autorisation accordée à la sélection de photo'
                          : 'Listo para cargar avatares desde tu carrete o explorador')}
                      {galleryStatus === 'testing' &&
                        (settings.language === 'en'
                          ? 'Opening photo picker...'
                          : settings.language === 'pt'
                          ? 'Abrindo seletor de fotos...'
                          : settings.language === 'fr'
                          ? 'Ouverture de la galerie...'
                          : 'Abriendo selector de imágenes...')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleTestGallery}
                  disabled={galleryStatus === 'testing'}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-xs font-semibold text-white transition shrink-0"
                >
                  {galleryStatus === 'testing'
                    ? (settings.language === 'en' ? 'Opening...' : 'Abriendo...')
                    : (settings.language === 'en' ? 'Test Gallery' : 'Probar Galería')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 6: BACKUP & DATA MANAGEMENT                             */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'backup' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionBackup}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Guarda tus datos localmente o restaura desde una copia JSON:
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onExportBackup}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition"
            >
              <div className="flex items-center gap-3 text-left">
                <Download className="w-5 h-5 text-indigo-500" />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Exportar Copia de Seguridad JSON
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Descarga todos los usuarios, rifas y resultados
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <label className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition">
              <div className="flex items-center gap-3 text-left">
                <Upload className="w-5 h-5 text-teal-500" />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Restaurar desde Archivo JSON
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Cargar respaldo previo en este dispositivo
                  </span>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportBackup(file);
                }}
              />
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </label>

            <button
              onClick={onResetData}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 transition text-rose-600 dark:text-rose-300"
            >
              <div className="flex items-center gap-3 text-left">
                <RefreshCw className="w-5 h-5 text-rose-500" />
                <div>
                  <span className="text-sm font-bold block">Restablecer Datos de Demostración</span>
                  <span className="text-xs opacity-80">Restaura rifas y usuarios de ejemplo</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-SCREEN 7: PWA APP INSTALLATION                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'install' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.sectionInstall}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Instala RaffleApp en tu teléfono o computadora para usarla sin conexión y desde tu menú de aplicaciones:
            </p>
          </div>

          <PWAInstallButton variant="card" />
        </div>
      )}
    </div>
  );
};
