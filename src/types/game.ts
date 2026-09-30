export interface Player {
  id: string;
  name: string;
  token: string; // Emoji representing the piece (🎩, 🚗, 🐶, 🚢, etc.)
  color: string; // Hex color for avatar
  balance: number;
  isBanker?: boolean;
  joinedAt: number;
}

export interface Transaction {
  id: string;
  gameId: string;
  fromId: string; // 'bank' or playerId
  fromName: string;
  toId: string; // 'bank' or playerId
  toName: string;
  amount: number;
  reason?: string;
  diceRoll?: number;
  timestamp: number;
}

export interface PropertyState {
  propertyId: string;
  ownerId: string | null; // null = Banco
  houses: number; // 0..4 = casas, 5 = hotel
  isMortgaged: boolean;
}

export interface Game {
  id: string; // Room code e.g. "MNPL-4821"
  name: string;
  initialBalance: number;
  passGoAmount: number;
  createdAt: number;
  players: Record<string, Player>;
  properties: Record<string, PropertyState>;
  transactions: Transaction[];
  version?: number;
}

export interface QRPayload {
  type: 'monopoly_pay';
  gameId: string;
  recipientId: string;
  recipientName: string;
  recipientToken: string;
  amount?: number;
  reason?: string;
  propertyId?: string;
}

export const MONOPOLY_TOKENS = [
  { emoji: '🎩', name: 'Sombrero', color: '#3b82f6' },
  { emoji: '🚗', name: 'Auto', color: '#ef4444' },
  { emoji: '🐶', name: 'Perro', color: '#eab308' },
  { emoji: '🚢', name: 'Barco', color: '#06b6d4' },
  { emoji: '👞', name: 'Zapato', color: '#8b5cf6' },
  { emoji: '🐈', name: 'Gato', color: '#ec4899' },
  { emoji: '🪙', name: 'Dedal', color: '#10b981' },
  { emoji: '✈️', name: 'Avión', color: '#f97316' },
  { emoji: '🦖', name: 'T-Rex', color: '#84cc16' },
  { emoji: '🐧', name: 'Pingüino', color: '#6366f1' },
];
