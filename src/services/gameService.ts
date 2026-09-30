import type { Game, Player, Transaction, PropertyState } from '../types/game';
import { MONOPOLY_PROPERTIES, PROPERTY_MAP } from '../data/monopolyProperties';
import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'monopoly_game_';

function initPropertiesMap(): Record<string, PropertyState> {
  const map: Record<string, PropertyState> = {};
  for (const p of MONOPOLY_PROPERTIES) {
    map[p.id] = {
      propertyId: p.id,
      ownerId: null,
      houses: 0,
      isMortgaged: false,
    };
  }
  return map;
}

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
    let game: Game | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monopoly_games')
          .select('data')
          .eq('id', gameId)
          .single();

        if (!error && data?.data) {
          game = data.data as Game;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage', err);
      }
    }

    if (!game) {
      const local = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
      if (local) {
        game = JSON.parse(local);
      }
    }

    // Ensure properties map exists (backwards compatibility)
    if (game && !game.properties) {
      game.properties = initPropertiesMap();
      await this.saveGame(game);
    }

    return game;
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
      properties: initPropertiesMap(),
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

  // --- PROPERTY ACTIONS ---

  // 1. Buy property directly from Bank
  static async buyPropertyFromBank(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def) throw new Error('Propiedad no válida');

    const propState = game.properties[propertyId];
    if (propState && propState.ownerId !== null) {
      throw new Error('Esta propiedad ya tiene dueño');
    }

    const player = game.players[playerId];
    if (!player) throw new Error('Jugador no encontrado');
    if (player.balance < def.price) {
      throw new Error(`Saldo insuficiente ($${player.balance}) para comprar ${def.name} ($${def.price})`);
    }

    // Debit player and update owner
    player.balance -= def.price;
    game.properties[propertyId] = {
      propertyId,
      ownerId: playerId,
      houses: 0,
      isMortgaged: false,
    };

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: playerId,
      fromName: player.name,
      toId: 'bank',
      toName: 'Banco',
      amount: def.price,
      reason: `Compra de propiedad: ${def.name}`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
  }

  // 2. Buy / Trade property from another player
  static async buyPropertyFromPlayer(
    gameId: string,
    buyerId: string,
    sellerId: string,
    propertyId: string,
    agreedPrice: number
  ): Promise<Game> {
    if (agreedPrice <= 0) throw new Error('El precio acordado debe ser mayor a 0');
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def) throw new Error('Propiedad no válida');

    const propState = game.properties[propertyId];
    if (!propState || propState.ownerId !== sellerId) {
      throw new Error('El vendedor no es el dueño actual de esta propiedad');
    }

    if (propState.houses > 0) {
      throw new Error('Debes vender todas las casas y hoteles antes de transferir la propiedad');
    }

    const buyer = game.players[buyerId];
    const seller = game.players[sellerId];
    if (!buyer || !seller) throw new Error('Jugador no encontrado');

    if (buyer.balance < agreedPrice) {
      throw new Error(`Saldo insuficiente ($${buyer.balance}) para pagar $${agreedPrice}`);
    }

    // Debit buyer, credit seller, change title deed owner
    buyer.balance -= agreedPrice;
    seller.balance += agreedPrice;
    propState.ownerId = buyerId;

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: buyerId,
      fromName: buyer.name,
      toId: sellerId,
      toName: seller.name,
      amount: agreedPrice,
      reason: `Compraventa de propiedad: ${def.name}`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
  }

  // 3. Build house or upgrade to hotel
  static async buildHouse(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def || def.houseCost === 0) {
      throw new Error('No se pueden edificar casas en esta propiedad');
    }

    const propState = game.properties[propertyId];
    if (!propState || propState.ownerId !== playerId) {
      throw new Error('Solo el propietario puede edificar');
    }

    if (propState.isMortgaged) {
      throw new Error('No se puede edificar sobre una propiedad hipotecada');
    }

    if (propState.houses >= 5) {
      throw new Error('Esta propiedad ya tiene un Hotel (nivel máximo)');
    }

    const player = game.players[playerId];
    if (!player || player.balance < def.houseCost) {
      throw new Error(`Saldo insuficiente ($${player?.balance}) para construir ($${def.houseCost})`);
    }

    player.balance -= def.houseCost;
    propState.houses += 1;

    const buildingLabel = propState.houses === 5 ? 'Hotel' : `Casa #${propState.houses}`;

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: playerId,
      fromName: player.name,
      toId: 'bank',
      toName: 'Banco',
      amount: def.houseCost,
      reason: `Construcción de ${buildingLabel} en ${def.name}`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
  }

  // 4. Sell house back to Bank (at 50% value)
  static async sellHouse(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def || def.houseCost === 0) throw new Error('Propiedad no edificable');

    const propState = game.properties[propertyId];
    if (!propState || propState.ownerId !== playerId) {
      throw new Error('No eres el dueño de esta propiedad');
    }

    if (propState.houses <= 0) {
      throw new Error('No hay casas para vender en esta propiedad');
    }

    const refund = Math.floor(def.houseCost / 2);
    const player = game.players[playerId];
    if (!player) throw new Error('Jugador no encontrado');

    const oldHouses = propState.houses;
    propState.houses -= 1;
    player.balance += refund;

    const soldLabel = oldHouses === 5 ? 'Hotel' : 'Casa';

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: 'bank',
      fromName: 'Banco',
      toId: playerId,
      toName: player.name,
      amount: refund,
      reason: `Venta de ${soldLabel} en ${def.name} al Banco (+50%)`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
  }

  // 5. Mortgage property (Bank pays 50% of price)
  static async mortgageProperty(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def) throw new Error('Propiedad no encontrada');

    const propState = game.properties[propertyId];
    if (!propState || propState.ownerId !== playerId) {
      throw new Error('No eres el dueño de esta propiedad');
    }

    if (propState.isMortgaged) {
      throw new Error('La propiedad ya está hipotecada');
    }

    if (propState.houses > 0) {
      throw new Error('Debes vender todas las construcciones antes de hipotecar');
    }

    const player = game.players[playerId];
    if (!player) throw new Error('Jugador no encontrado');

    propState.isMortgaged = true;
    player.balance += def.mortgageValue;

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: 'bank',
      fromName: 'Banco',
      toId: playerId,
      toName: player.name,
      amount: def.mortgageValue,
      reason: `Hipoteca de ${def.name} recibida del Banco`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
  }

  // 6. Unmortgage property (Pay mortgage + 10% interest)
  static async unmortgageProperty(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Partida no encontrada');

    const def = PROPERTY_MAP.get(propertyId);
    if (!def) throw new Error('Propiedad no encontrada');

    const propState = game.properties[propertyId];
    if (!propState || propState.ownerId !== playerId) {
      throw new Error('No eres el dueño de esta propiedad');
    }

    if (!propState.isMortgaged) {
      throw new Error('La propiedad no está hipotecada');
    }

    const cost = Math.round(def.mortgageValue * 1.10);
    const player = game.players[playerId];
    if (!player || player.balance < cost) {
      throw new Error(`Saldo insuficiente ($${player?.balance}) para deshipotecar ($${cost} = Hipoteca + 10%)`);
    }

    player.balance -= cost;
    propState.isMortgaged = false;

    game.transactions.unshift({
      id: crypto.randomUUID(),
      gameId,
      fromId: playerId,
      fromName: player.name,
      toId: 'bank',
      toName: 'Banco',
      amount: cost,
      reason: `Cancelación de hipoteca (+10% interés) de ${def.name}`,
      timestamp: Date.now(),
    });

    await this.saveGame(game);
    return game;
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
