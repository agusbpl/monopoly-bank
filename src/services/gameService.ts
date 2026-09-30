import type { Game, Player, Transaction, PropertyState, TradeOffer } from '../types/game';
import {
  MONOPOLY_PROPERTIES,
  PROPERTY_MAP,
  canBuildHouse,
  canSellHouse,
} from '../data/monopolyProperties';
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
  private static mutationQueues: Map<string, Promise<unknown>> = new Map();

  /**
   * Serializes mutations per gameId in memory to eliminate local race conditions
   */
  private static enqueue<T>(gameId: string, operation: () => Promise<T>): Promise<T> {
    const prev = this.mutationQueues.get(gameId) || Promise.resolve();
    const next = prev.catch(() => {}).then(operation);
    this.mutationQueues.set(gameId, next);
    return next;
  }

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

    // Ensure properties map and version exist (backwards compatibility)
    if (game) {
      let needsSave = false;
      if (!game.version) {
        game.version = 1;
        needsSave = true;
      }
      if (!game.properties) {
        game.properties = initPropertiesMap();
        needsSave = true;
      }
      if (!game.pendingTrades) {
        game.pendingTrades = {};
        needsSave = true;
      }
      if (needsSave) {
        await this.saveGame(game);
      }
    }

    return game;
  }

  // Save game state with version increment for Optimistic Concurrency Control
  static async saveGame(game: Game): Promise<void> {
    game.version = (game.version ?? 0) + 1;

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
      version: 1,
      pendingTrades: {},
    };

    await this.saveGame(newGame);
    return newGame;
  }

  // Add or update player
  static async joinPlayer(gameId: string, player: Omit<Player, 'balance' | 'joinedAt'>): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      if (!game.players[player.id]) {
        const isFirstPlayer = Object.keys(game.players).length === 0;
        if (!game.bankerId && isFirstPlayer) {
          game.bankerId = player.id;
        }

        game.players[player.id] = {
          ...player,
          balance: game.initialBalance,
          isBanker: game.bankerId === player.id,
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
    });
  }

  // Transfer money between entities (players or bank)
  static async transfer(
    gameId: string,
    fromId: string,
    toId: string,
    amount: number,
    reason?: string,
    diceRoll?: number
  ): Promise<Game> {
    return this.enqueue(gameId, async () => {
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
        diceRoll,
        timestamp: Date.now(),
      };

      game.transactions.unshift(transaction);
      await this.saveGame(game);
      return game;
    });
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
    return this.enqueue(gameId, async () => {
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
    });
  }

  // 2. Buy / Trade property from another player
  static async buyPropertyFromPlayer(
    gameId: string,
    buyerId: string,
    sellerId: string,
    propertyId: string,
    agreedPrice: number
  ): Promise<Game> {
    return this.enqueue(gameId, async () => {
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
    });
  }

  // 3. Build house or upgrade to hotel
  static async buildHouse(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      const def = PROPERTY_MAP.get(propertyId);
      if (!def || def.houseCost === 0) {
        throw new Error('No se pueden edificar casas en esta propiedad');
      }

      const player = game.players[playerId];
      if (!player) throw new Error('Jugador no encontrado');

      // Validar reglas oficiales de Monopoly (incluida regla de edificación uniforme)
      const validation = canBuildHouse(propertyId, game.properties, player.balance);
      if (!validation.allowed) {
        throw new Error(validation.reason || 'No se puede edificar en esta propiedad');
      }

      const propState = game.properties[propertyId];
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
    });
  }

  // 4. Sell house back to Bank (at 50% value)
  static async sellHouse(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      const def = PROPERTY_MAP.get(propertyId);
      if (!def || def.houseCost === 0) throw new Error('Propiedad no edificable');

      const propState = game.properties[propertyId];
      if (!propState || propState.ownerId !== playerId) {
        throw new Error('No eres el dueño de esta propiedad');
      }

      // Validar regla de venta uniforme
      const validation = canSellHouse(propertyId, game.properties);
      if (!validation.allowed) {
        throw new Error(validation.reason || 'No se puede vender esta construcción');
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
    });
  }

  // 5. Mortgage property (Bank pays 50% of price)
  static async mortgageProperty(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
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
    });
  }

  // 6. Unmortgage property (Pay mortgage + 10% interest)
  static async unmortgageProperty(gameId: string, playerId: string, propertyId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
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
    });
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

  // --- BILATERAL TRADES & BANKER ACTIONS ---

  // Create a bilateral trade offer (cash + properties)
  static async createTradeOffer(
    gameId: string,
    offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>
  ): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      const initiator = game.players[offer.initiatorId];
      const target = game.players[offer.targetId];
      if (!initiator || !target) throw new Error('Jugadores de la propuesta no válidos');

      if (offer.offeredCash < 0 || offer.requestedCash < 0) {
        throw new Error('Los montos no pueden ser negativos');
      }

      if (initiator.balance < offer.offeredCash) {
        throw new Error(`Saldo insuficiente (${initiator.balance} €) para ofrecer ${offer.offeredCash} €`);
      }

      // Verify offered properties belong to initiator and have 0 houses
      for (const propId of offer.offeredPropertyIds) {
        const state = game.properties[propId];
        if (!state || state.ownerId !== initiator.id) {
          throw new Error('Una o más propiedades ofrecidas no te pertenecen');
        }
        if (state.houses > 0) {
          throw new Error('No puedes ofrecer propiedades que tengan construcciones');
        }
      }

      // Verify requested properties belong to target and have 0 houses
      for (const propId of offer.requestedPropertyIds) {
        const state = game.properties[propId];
        if (!state || state.ownerId !== target.id) {
          throw new Error('Una o más propiedades pedidas no pertenecen al destinatario');
        }
        if (state.houses > 0) {
          throw new Error('No puedes pedir propiedades que tengan construcciones');
        }
      }

      if (!game.pendingTrades) {
        game.pendingTrades = {};
      }

      const tradeId = crypto.randomUUID();
      const trade: TradeOffer = {
        ...offer,
        id: tradeId,
        status: 'pending',
        createdAt: Date.now(),
      };

      game.pendingTrades[tradeId] = trade;
      await this.saveGame(game);
      return game;
    });
  }

  // Respond to a bilateral trade offer (Accept or Reject)
  static async respondToTradeOffer(
    gameId: string,
    tradeId: string,
    accept: boolean
  ): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      const trade = game.pendingTrades?.[tradeId];
      if (!trade || trade.status !== 'pending') {
        throw new Error('La oferta ya no está disponible');
      }

      if (!accept) {
        trade.status = 'rejected';
        await this.saveGame(game);
        return game;
      }

      const initiator = game.players[trade.initiatorId];
      const target = game.players[trade.targetId];
      if (!initiator || !target) throw new Error('Jugadores no encontrados');

      // Validate balances at time of acceptance
      if (initiator.balance < trade.offeredCash) {
        throw new Error(`${initiator.name} no cuenta con el efectivo ofrecido (${trade.offeredCash} €)`);
      }
      if (target.balance < trade.requestedCash) {
        throw new Error(`Saldo insuficiente (${target.balance} €) para aceptar pagar ${trade.requestedCash} €`);
      }

      // Validate properties still belong to respective players
      for (const propId of trade.offeredPropertyIds) {
        const state = game.properties[propId];
        if (!state || state.ownerId !== initiator.id || state.houses > 0) {
          throw new Error('Las propiedades ofrecidas ya no están disponibles para trueque');
        }
      }
      for (const propId of trade.requestedPropertyIds) {
        const state = game.properties[propId];
        if (!state || state.ownerId !== target.id || state.houses > 0) {
          throw new Error('Las propiedades solicitadas ya no están disponibles para trueque');
        }
      }

      // 1. Swap cash
      if (trade.offeredCash > 0) {
        initiator.balance -= trade.offeredCash;
        target.balance += trade.offeredCash;
      }
      if (trade.requestedCash > 0) {
        target.balance -= trade.requestedCash;
        initiator.balance += trade.requestedCash;
      }

      // 2. Swap properties
      for (const propId of trade.offeredPropertyIds) {
        game.properties[propId].ownerId = target.id;
      }
      for (const propId of trade.requestedPropertyIds) {
        game.properties[propId].ownerId = initiator.id;
      }

      // 3. Mark trade accepted
      trade.status = 'accepted';

      // 4. Audit ledger entry
      game.transactions.unshift({
        id: crypto.randomUUID(),
        gameId,
        fromId: initiator.id,
        fromName: initiator.name,
        toId: target.id,
        toName: target.name,
        amount: Math.abs(trade.offeredCash - trade.requestedCash),
        reason: `Trueque bilateral aceptado (${trade.offeredPropertyIds.length} escrituras ↔ ${trade.requestedPropertyIds.length} escrituras)`,
        timestamp: Date.now(),
      });

      await this.saveGame(game);
      return game;
    });
  }

  // Cancel an outgoing trade offer
  static async cancelTradeOffer(gameId: string, tradeId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      if (game.pendingTrades?.[tradeId]) {
        game.pendingTrades[tradeId].status = 'canceled';
        await this.saveGame(game);
      }
      return game;
    });
  }

  // Banker action: Auction an unowned property to highest bidder
  static async auctionProperty(
    gameId: string,
    propertyId: string,
    winnerId: string,
    winningBid: number
  ): Promise<Game> {
    return this.enqueue(gameId, async () => {
      if (winningBid <= 0) throw new Error('El monto de la puja debe ser mayor a 0');
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');

      const def = PROPERTY_MAP.get(propertyId);
      if (!def) throw new Error('Propiedad no encontrada');

      const propState = game.properties[propertyId];
      if (!propState || propState.ownerId !== null) {
        throw new Error('Solo se pueden subastar propiedades del Banco');
      }

      const winner = game.players[winnerId];
      if (!winner) throw new Error('Jugador ganador no encontrado');
      if (winner.balance < winningBid) {
        throw new Error(`Saldo insuficiente (${winner.balance} €) para pagar la puja de ${winningBid} €`);
      }

      winner.balance -= winningBid;
      propState.ownerId = winner.id;
      propState.houses = 0;
      propState.isMortgaged = false;

      game.transactions.unshift({
        id: crypto.randomUUID(),
        gameId,
        fromId: winner.id,
        fromName: winner.name,
        toId: 'bank',
        toName: 'Banco',
        amount: winningBid,
        reason: `Subasta adjudicada: ${def.name} por ${winningBid} €`,
        timestamp: Date.now(),
      });

      await this.saveGame(game);
      return game;
    });
  }

  // Assign Banker role to another player
  static async setBanker(gameId: string, bankerId: string): Promise<Game> {
    return this.enqueue(gameId, async () => {
      const game = await this.getGame(gameId);
      if (!game) throw new Error('Partida no encontrada');
      if (!game.players[bankerId]) throw new Error('Jugador no encontrado');

      game.bankerId = bankerId;
      Object.values(game.players).forEach((p) => {
        p.isBanker = p.id === bankerId;
      });

      await this.saveGame(game);
      return game;
    });
  }
}
