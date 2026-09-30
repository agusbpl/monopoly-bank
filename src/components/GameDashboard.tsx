import React from 'react';
import {
  QrCode,
  Scan,
  Landmark,
  ArrowRight,
  Sparkles,
  Users,
  History,
  Building2,
} from 'lucide-react';
import type { Game, Player } from '../types/game';
import { playPassGoSound, triggerHaptic } from '../utils/sound';
import confetti from 'canvas-confetti';

interface GameDashboardProps {
  game: Game;
  currentPlayer: Player;
  onOpenScanner: () => void;
  onOpenGenerator: () => void;
  onOpenProperties: () => void;
  onOpenBank: () => void;
  onOpenHistory: () => void;
  onPassGo: () => Promise<void>;
  onDirectTransferToPlayer: (targetPlayerId: string) => void;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  game,
  currentPlayer,
  onOpenScanner,
  onOpenGenerator,
  onOpenProperties,
  onOpenBank,
  onOpenHistory,
  onPassGo,
  onDirectTransferToPlayer,
}) => {
  const otherPlayers = Object.values(game.players).filter((p) => p.id !== currentPlayer.id);
  const recentTransactions = game.transactions.slice(0, 3);

  const myProperties = Object.values(game.properties || {}).filter(
    (p) => p.ownerId === currentPlayer.id
  );

  const handlePassGoClick = async () => {
    playPassGoSound();
    triggerHaptic('success');
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
    await onPassGo();
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-6 shadow-xl shadow-amber-500/20 text-black">
        {/* Background decorative pattern */}
        <div className="absolute -right-6 -bottom-6 text-9xl opacity-15 select-none pointer-events-none">
          {currentPlayer.token}
        </div>

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl bg-black/10 rounded-2xl p-1.5 backdrop-blur-sm">
              {currentPlayer.token}
            </span>
            <div>
              <h2 className="font-black text-lg text-black leading-tight">
                {currentPlayer.name}
              </h2>
              <span className="text-[11px] font-bold text-black/75 uppercase tracking-wide">
                {game.name}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black/15 rounded-full">
            {game.id}
          </span>
        </div>

        <div className="relative z-10 space-y-1">
          <span className="text-xs font-bold text-black/70 uppercase tracking-wider">
            Saldo Disponible
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-950">
            ${currentPlayer.balance.toLocaleString()}
          </div>
        </div>

        {/* Quick Pass GO button inside banner */}
        <div className="mt-5 relative z-10">
          <button
            type="button"
            onClick={handlePassGoClick}
            className="w-full py-3 px-4 bg-black text-amber-400 hover:bg-slate-900 active:scale-[0.98] font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Paso por la Salida (+ ${game.passGoAmount})</span>
          </button>
        </div>
      </div>

      {/* Primary Action Buttons (QR Transfer & QR Receive) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenScanner}
          className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
            <Scan className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="font-extrabold text-sm text-white block">Escanear y Pagar</span>
            <span className="text-[10px] text-slate-400">Cámara QR</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenGenerator}
          className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="font-extrabold text-sm text-white block">Cobrar (Mi QR)</span>
            <span className="text-[10px] text-slate-400">Generar código</span>
          </div>
        </button>
      </div>

      {/* NEW: Property Market / Portfolio Button */}
      <button
        type="button"
        onClick={onOpenProperties}
        className="w-full p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 border border-amber-500/30 rounded-3xl flex items-center justify-between gap-3 shadow-lg transition group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white">Mercado de Propiedades</h4>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg">
                {myProperties.length} en tu poder
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Comprar al Banco, negociar con rivales, casas e hipotecas
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition" />
      </button>

      {/* Secondary Quick Action: Bank Operations */}
      <button
        type="button"
        onClick={onOpenBank}
        className="w-full p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-xs text-white">Operaciones con el Banco</h4>
            <p className="text-[11px] text-slate-400">
              Pagar cárcel, impuestos o cobrar del banco
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
      </button>

      {/* Other Players in the Game */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Jugadores en la mesa ({Object.keys(game.players).length})
          </span>
          <span className="text-[10px] text-slate-500">Tocá para transferir directo</span>
        </div>

        {otherPlayers.length === 0 ? (
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
            Esperando que otros jugadores se unan con el código <b>{game.id}</b>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {otherPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => onDirectTransferToPlayer(player.id)}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl text-left flex items-center gap-2.5 transition active:scale-[0.98]"
              >
                <span className="text-2xl shrink-0">{player.token}</span>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs text-white truncate">{player.name}</p>
                  <p className="text-xs font-mono font-semibold text-emerald-400">
                    ${player.balance.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Mini-Feed */}
      {recentTransactions.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Últimos movimientos
            </span>
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Ver todo ({game.transactions.length})
            </button>
          </div>

          <div className="space-y-1.5">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-3 py-2 bg-slate-950/70 border border-slate-900 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 truncate text-slate-300">
                  <span className="font-bold text-white">{tx.fromName}</span>
                  <span className="text-slate-600">➜</span>
                  <span className="font-bold text-white">{tx.toName}</span>
                  {tx.reason && (
                    <span className="text-[10px] text-slate-500 italic truncate">
                      ({tx.reason})
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
                  ${tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
