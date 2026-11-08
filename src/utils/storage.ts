import { AppUser, Raffle } from '../types';
import { generateRaffleName } from './naming';
import { getDefaultAvatar } from './avatars';

const USERS_STORAGE_KEY = 'raffle_users_v1';
const RAFFLES_STORAGE_KEY = 'raffle_items_v1';
const CORRELATIVE_STORAGE_KEY = 'raffle_correlative_v1';
const SETTINGS_STORAGE_KEY = 'raffle_settings_v1';

export type AppTheme = 'light' | 'dark' | 'system';
export type AppLanguage = 'es' | 'en' | 'pt' | 'fr';

export interface AppSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  theme: AppTheme;
  language: AppLanguage;
}

function detectDeviceLanguage(): AppLanguage {
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || (navigator as { userLanguage?: string }).userLanguage || '').toLowerCase();
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('en')) return 'en';
  }
  return 'es';
}

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  theme: 'dark',
  language: detectDeviceLanguage(),
};

// Seed initial mock data so the app has an exciting, ready-to-test experience
function getInitialUsers(): AppUser[] {
  const users: Omit<AppUser, 'photoUrl'>[] = [
    { id: 'usr-1', name: 'Carlos Mendoza', phone: '+52 55 1234 5678', gender: 'hombre', createdAt: Date.now() - 86400000 * 3 },
    { id: 'usr-2', name: 'Valeria Gómez', phone: '+52 55 9876 5432', gender: 'mujer', createdAt: Date.now() - 86400000 * 3 },
    { id: 'usr-3', name: 'Mateo Fernández', phone: '+52 55 4567 8901', gender: 'hombre', createdAt: Date.now() - 86400000 * 2 },
    { id: 'usr-4', name: 'Sofía Navarro', phone: '+52 55 3456 7890', gender: 'mujer', createdAt: Date.now() - 86400000 * 2 },
    { id: 'usr-5', name: 'Alejandro Ruiz', phone: '+52 55 7890 1234', gender: 'hombre', createdAt: Date.now() - 86400000 * 1 },
    { id: 'usr-6', name: 'Camila Herrera', phone: '+52 55 2345 6789', gender: 'mujer', createdAt: Date.now() - 86400000 * 1 },
  ];

  return users.map(u => ({
    ...u,
    photoUrl: getDefaultAvatar(u.gender, u.name),
  }));
}

function getInitialRaffles(users: AppUser[]): { raffles: Raffle[]; correlative: number } {
  const now = new Date();
  
  // 1. Active Raffle
  const activeName = generateRaffleName(1, now);
  const activeRaffle: Raffle = {
    id: 'raf-1',
    name: activeName,
    correlativeNumber: 1,
    totalNumbers: 100,
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    assignments: [
      { userId: users[0]?.id || 'usr-1', assignedNumbers: [7, 18, 42, 88] },
      { userId: users[1]?.id || 'usr-2', assignedNumbers: [12, 25, 63] },
      { userId: users[2]?.id || 'usr-3', assignedNumbers: [3, 31, 74, 91, 99] },
      { userId: users[3]?.id || 'usr-4', assignedNumbers: [14, 50] },
      { userId: users[4]?.id || 'usr-5', assignedNumbers: [29, 68, 77] },
    ],
  };

  // 2. Completed Raffle
  const pastDate = new Date(Date.now() - 86400000 * 2);
  const completedName = generateRaffleName(2, pastDate);
  const completedRaffle: Raffle = {
    id: 'raf-2',
    name: completedName,
    correlativeNumber: 2,
    totalNumbers: 50,
    status: 'completed',
    createdAt: pastDate.getTime(),
    assignments: [
      { userId: users[0]?.id || 'usr-1', assignedNumbers: [9, 21] },
      { userId: users[1]?.id || 'usr-2', assignedNumbers: [15, 33, 44] },
      { userId: users[3]?.id || 'usr-4', assignedNumbers: [27, 48] },
    ],
    completedDraw: {
      drawDate: pastDate.getTime() + 1000 * 60 * 60 * 3,
      totalAssignedParticipating: 7,
      disqualified: [
        { order: 1, number: 21, userId: users[0]?.id || 'usr-1', message: '¡Cerca! Primer número descalificado.' },
        { order: 2, number: 44, userId: users[1]?.id || 'usr-2', message: '¡Por poco! Segundo número descalificado.' },
      ],
      winners: [
        { place: 1, number: 15, userId: users[1]?.id || 'usr-2', timestamp: pastDate.getTime() + 1000 * 60 * 60 * 3 },
      ],
    },
  };

  return {
    raffles: [activeRaffle, completedRaffle],
    correlative: 3,
  };
}

export const storage = {
  getUsers(): AppUser[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) {
        const initial = getInitialUsers();
        this.saveUsers(initial);
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  },

  addUser(user: AppUser): void {
    const users = this.getUsers();
    users.unshift(user);
    this.saveUsers(users);
  },

  updateUser(updated: AppUser): void {
    const users = this.getUsers().map(u => (u.id === updated.id ? updated : u));
    this.saveUsers(users);
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  },

  getRaffles(): Raffle[] {
    try {
      const raw = localStorage.getItem(RAFFLES_STORAGE_KEY);
      if (!raw) {
        const users = this.getUsers();
        const initial = getInitialRaffles(users);
        this.saveRaffles(initial.raffles);
        this.saveCorrelative(initial.correlative);
        return initial.raffles;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRaffles(raffles: Raffle[]): void {
    try {
      localStorage.setItem(RAFFLES_STORAGE_KEY, JSON.stringify(raffles));
    } catch (e) {
      console.error('Error saving raffles to localStorage', e);
    }
  },

  addRaffle(raffle: Raffle): void {
    const raffles = this.getRaffles();
    raffles.unshift(raffle);
    this.saveRaffles(raffles);
  },

  updateRaffle(updated: Raffle): void {
    const raffles = this.getRaffles().map(r => (r.id === updated.id ? updated : r));
    this.saveRaffles(raffles);
  },

  deleteRaffle(raffleId: string): void {
    const raffles = this.getRaffles().filter(r => r.id !== raffleId);
    this.saveRaffles(raffles);
  },

  getCorrelative(): number {
    try {
      const raw = localStorage.getItem(CORRELATIVE_STORAGE_KEY);
      return raw ? parseInt(raw, 10) : 1;
    } catch {
      return 1;
    }
  },

  saveCorrelative(nextVal: number): void {
    try {
      localStorage.setItem(CORRELATIVE_STORAGE_KEY, String(nextVal));
    } catch (e) {
      console.error(e);
    }
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  resetAllData(): void {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(RAFFLES_STORAGE_KEY);
    localStorage.removeItem(CORRELATIVE_STORAGE_KEY);
  },
};
