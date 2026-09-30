import React, { useState } from 'react';
import { Play, PlusCircle, LogIn, Database } from 'lucide-react';
import type { Game, Player } from '../types/game';
import { MONOPOLY_TOKENS } from '../types/game';
import { GameService } from '../services/gameService';
import { isSupabaseConfigured } from '../services/supabase';

interface LobbyProps {
  onGameJoined: (game: Game, player: Player) => void;
  onOpenGuide: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameJoined, onOpenGuide }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Create form
  const [roomName, setRoomName] = useState('Partida Monopoly');
  const [initialBalance, setInitialBalance] = useState(1500);
  const [passGoAmount, setPassGoAmount] = useState(200);

  // Join form
  const [roomCode, setRoomCode] = useState('');

  // Shared player profile
  const [playerName, setPlayerName] = useState('');
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedToken = MONOPOLY_TOKENS[selectedTokenIndex];

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Por favor ingresá tu nombre de jugador');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newGame = await GameService.createGame(roomName, initialBalance, passGoAmount);

      const playerId = crypto.randomUUID();
      const hostPlayer: Omit<Player, 'balance' | 'joinedAt'> = {
        id: playerId,
        name: playerName.trim(),
        token: selectedToken.emoji,
        color: selectedToken.color,
        isBanker: true,
      };

      const updatedGame = await GameService.joinPlayer(newGame.id, hostPlayer);
      onGameJoined(updatedGame, updatedGame.players[playerId]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Ingresá el código de la partida');
      return;
    }
    if (!playerName.trim()) {
      setError('Ingresá tu nombre de jugador');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cleanCode = roomCode.trim().toUpperCase();
      const game = await GameService.getGame(cleanCode);

      if (!game) {
        throw new Error(`No se encontró la partida "${cleanCode}". Verificá el código.`);
      }

      // Check if existing player with this name exists or create new
      const existingPlayer = Object.values(game.players).find(
        (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
      );

      const playerId = existingPlayer ? existingPlayer.id : crypto.randomUUID();

      const playerToJoin: Omit<Player, 'balance' | 'joinedAt'> = {
        id: playerId,
        name: playerName.trim(),
        token: selectedToken.emoji,
        color: selectedToken.color,
        isBanker: false,
      };

      const updatedGame = await GameService.joinPlayer(game.id, playerToJoin);
      onGameJoined(updatedGame, updatedGame.players[playerId]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-b border-slate-800/80 text-center relative">
          <button
            type="button"
            onClick={onOpenGuide}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guía APIs</span>
          </button>

          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 text-3xl">
            🎩
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Monopoly Pay</h1>
          <p className="text-xs text-slate-400 mt-1">
            Banca digital y transferencias instantáneas por QR
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-slate-800/70 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {isSupabaseConfigured ? 'Multijugador Cloud Activo' : 'Modo Local / Sin Backend'}
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTab('create');
                setError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'create'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Sala</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('join');
                setError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'join'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Unirse a Sala</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={tab === 'create' ? handleCreateGame : handleJoinGame} className="space-y-4">
            {/* Player details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tu Nombre de Jugador:</label>
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Agustín, Matías, Sofía..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Token Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Elegí tu Ficha: <span className="text-amber-400 font-semibold">{selectedToken.name}</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MONOPOLY_TOKENS.map((token, index) => (
                  <button
                    key={token.emoji}
                    type="button"
                    onClick={() => setSelectedTokenIndex(index)}
                    className={`h-11 rounded-xl text-2xl flex items-center justify-center transition border ${
                      selectedTokenIndex === index
                        ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {token.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab specific fields */}
            {tab === 'create' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nombre de la Partida:</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ej. Monopoly Amigos"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Dinero Inicial:</label>
                    <input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Premio Salida:</label>
                    <input
                      type="number"
                      value={passGoAmount}
                      onChange={(e) => setPassGoAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Código de Sala:</label>
                <input
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Ej. M-4821"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono uppercase font-bold text-amber-400 tracking-wider focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <span>Cargando...</span>
              ) : tab === 'create' ? (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Crear Partida y Ser Banquero</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar a la Partida</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
