import React, { useState } from 'react';
import { X, History, ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Game, Player } from '../types/game';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  currentPlayer: Player;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  game,
  currentPlayer,
}) => {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  if (!isOpen) return null;

  const transactions = game.transactions.filter((tx) => {
    if (filter === 'mine') {
      return tx.fromId === currentPlayer.id || tx.toId === currentPlayer.id;
    }
    return true;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Historial de Movimientos</h3>
              <p className="text-xs text-slate-400">{transactions.length} transacciones registradas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-amber-400 text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas las jugadas
          </button>
          <button
            type="button"
            onClick={() => setFilter('mine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'mine'
                ? 'bg-amber-400 text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Mis transferencias
          </button>
        </div>

        {/* Transactions list */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">Aún no hay transacciones en esta partida</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isMineSender = tx.fromId === currentPlayer.id;
              const isMineReceiver = tx.toId === currentPlayer.id;

              return (
                <div
                  key={tx.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isMineReceiver
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isMineSender
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isMineReceiver ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isMineSender ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                        <span>{tx.fromName}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{tx.toName}</span>
                      </div>
                      {tx.reason && (
                        <p className="text-[11px] text-slate-400 truncate">{tx.reason}</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatTime(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        isMineReceiver
                          ? 'text-emerald-400'
                          : isMineSender
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {isMineReceiver ? '+' : isMineSender ? '-' : ''}${tx.amount}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
