export type Gender = 'hombre' | 'mujer';

export interface AppUser {
  id: string;
  name: string;
  phone?: string;
  gender: Gender;
  photoUrl: string; // Base64 data URL or SVG avatar
  createdAt: number;
}

export interface RaffleAssignment {
  userId: string;
  assignedNumbers: number[];
}

export interface DisqualifiedRecord {
  order: number;
  number: number;
  userId: string;
  message?: string;
}

export interface WinnerRecord {
  place: number; // 1 = 1er Lugar, 2 = 2do Lugar...
  number: number;
  userId: string;
  timestamp: number;
}

export interface CompletedDraw {
  drawDate: number;
  disqualified: DisqualifiedRecord[];
  winners: WinnerRecord[];
  totalAssignedParticipating: number;
}

export interface Raffle {
  id: string;
  name: string; // Format: SAB-07-11-26-0001
  correlativeNumber: number;
  totalNumbers: number;
  status: 'active' | 'completed';
  createdAt: number;
  assignments: RaffleAssignment[];
  completedDraw?: CompletedDraw;
}

export interface DrawConfig {
  raffleId: string;
  disqualifiedCount: number;
  winnerCount: number;
}
