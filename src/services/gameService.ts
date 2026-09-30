import type { Game, Player, Transaction } from '../types/game';
import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'monopoly_game_';

export class GameService {
  private static broadcastChannels: Map<string, BroadcastChannel> = new Map();

  private static getChannel(gameId: string): BroadcastChannel | null {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
    if (!this.broadcastChannels.has(gameId)) {
      this.broadcastChannels.set(gameId, new BroadcastChannel(`${STORAGE_PREFIX}${gameId}`));
    }
    return this.broadcastChannels.get(gameId)!;
  }

  // Load game from local storage or remote
  static async getGame(gameId: string): Promise<Game | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monopoly_games')
          .select('data')
          .eq('id', gameId)
          .single();

        if (!error && data?.data) {
          localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(data.data));
          return data.data as Game;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage', err);
      }
    }

    // Local fallback
    const local = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    return local ? JSON.parse(local) : null;
  }

  // Save game state
  static async saveGame(game: Game): Promise<void> {
    // 1. Save locally
    localStorage.setItem(`${STORAGE_PREFIX}${game.id}`, JSON.stringify(game));

    // 2. Broadcast to other tabs/windows locally
    const channel = this.getChannel(game.id);
    if (channel) {
      channel.postMessage({ type: 'GAME_UPDATED', game });
    }

    // 3. Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('monopoly_games')
          .upsert({
            id: game.id,
            data: game,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Error saving game to Supabase:', err);
      }
    }
  }

  // Create a new game room
  static async createGame(name: string, initialBalance = 1500, passGoAmount = 200): Promise<Game> {
    const code = 'M-' + Math.floor(1000 + Math.random() * 9000);
    const newGame: Game = {
      id: code,
      name: name.trim() || 'Partida Monopoly',
      initialBalance,
      passGoAmount,
      createdAt: Date.now(),
      players: {},
      transactions: [],
    };

    await this.saveGame(newGame);
    return newGame;
  }

  // Add or update player
  static async joinPlayer(gameId: string, player: Omit<Player, 'balance' | 'joinedAt'>): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    if (!game.players[player.id]) {
      game.players[player.id] = {
        ...player,
        balance: game.initialBalance,
        joinedAt: Date.now(),
      };

      // Add join transaction
      game.transactions.unshift({
        id: crypto.randomUUID(),
        gameId,
        fromId: 'bank',
        fromName: 'Banco',
        toId: player.id,
        toName: player.name,
        amount: game.initialBalance,
        reason: 'Fondos iniciales de partida',
        timestamp: Date.now(),
      });

      await this.saveGame(game);
    }

    return game;
  }

  // Transfer money between entities (players or bank)
  static async transfer(
    gameId: string,
    fromId: string,
    toId: string,
    amount: number,
    reason?: string
  ): Promise<Game> {
    if (amount <= 0) throw new Error('El monto debe ser mayor a 0');
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    let fromName = 'Banco';
    let toName = 'Banco';

    // Debit sender if not bank
    if (fromId !== 'bank') {
      const sender = game.players[fromId];
      if (!sender) throw new Error('Jugador emisor no existe');
      if (sender.balance < amount) {
        throw new Error(`Saldo insuficiente ($${sender.balance} disponibles)`);
      }
      sender.balance -= amount;
      fromName = sender.name;
    }

    // Credit receiver if not bank
    if (toId !== 'bank') {
      const receiver = game.players[toId];
      if (!receiver) throw new Error('Jugador receptor no existe');
      receiver.balance += amount;
      toName = receiver.name;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      gameId,
      fromId,
      fromName,
      toId,
      toName,
      amount,
      reason: reason?.trim() || undefined,
      timestamp: Date.now(),
    };

    game.transactions.unshift(transaction);
    await this.saveGame(game);
    return game;
  }

  // Quick Pass GO ($200 from bank)
  static async passGo(gameId: string, playerId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');
    return await this.transfer(
      gameId,
      'bank',
      playerId,
      game.passGoAmount,
      'Salida (+ $200)'
    );
  }

  // Subscribe to real-time updates
  static subscribeToGame(gameId: string, onUpdate: (game: Game) => void): () => void {
    // 1. Local broadcast channel
    const channel = this.getChannel(gameId);
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'GAME_UPDATED' && event.data.game?.id === gameId) {
        onUpdate(event.data.game);
      }
    };
    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    // 2. Storage event listener (syncs across tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}${gameId}` && e.newValue) {
        try {
          const game = JSON.parse(e.newValue);
          onUpdate(game);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime channel
    let supabaseSub: RealtimeChannel | null = null;
    if (isSupabaseConfigured && supabase) {
      supabaseSub = supabase
        .channel(`room_${gameId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'monopoly_games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            if (payload.new && (payload.new as { data?: Game }).data) {
              const game = (payload.new as { data: Game }).data;
              localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(game));
              onUpdate(game);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('storage', handleStorage);
      if (supabaseSub && supabase) {
        supabase.removeChannel(supabaseSub);
      }
    };
  }
}
