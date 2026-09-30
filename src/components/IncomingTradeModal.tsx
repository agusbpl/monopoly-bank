import React, { useState } from 'react';
import { ArrowLeftRight, Check, X, Coins, Building2, AlertCircle } from 'lucide-react';
import type { Game, Player, TradeOffer } from '../types/game';
import { PROPERTY_MAP } from '../data/monopolyProperties';
import { playCoinsSound, playBuzzerSound, triggerHaptic } from '../utils/sound';
import confetti from 'canvas-confetti';

interface IncomingTradeModalProps {
  game: Game;
  currentPlayer: Player;
  onRespondTrade: (tradeId: string, accept: boolean) => Promise<void>;
}

export const IncomingTradeModal: React.FC<IncomingTradeModalProps> = ({
  game,
  currentPlayer,
  onRespondTrade,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find any pending trade targeting currentPlayer
  const pendingTrade = Object.values(game.pendingTrades || {}).find(
    (t: TradeOffer) => t.targetId === currentPlayer.id && t.status === 'pending'
  );

  if (!pendingTrade) return null;

  const initiator = game.players[pendingTrade.initiatorId];
  const canAfford = currentPlayer.balance >= pendingTrade.requestedCash;

  const handleRespond = async (accept: boolean) => {
    try {
      setIsSubmitting(true);
      await onRespondTrade(pendingTrade.id, accept);
      if (accept) {
        playCoinsSound();
        triggerHaptic('success');
        confetti({ particleCount: 70, spread: 70 });
      } else {
        triggerHaptic('warning');
      }
    } catch (err: unknown) {
      playBuzzerSound();
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col space-y-4 p-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-amber-500/20 text-amber-400 rounded-2xl mb-1 shadow-inner">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
            ¡Propuesta de Trueque en Vivo!
          </span>
          <h3 className="text-xl font-black text-white">
            {initiator ? `${initiator.token} ${initiator.name}` : pendingTrade.initiatorName} te ofrece un trato
          </h3>
          <p className="text-xs text-slate-400">
            Revisá los términos antes de aceptar o rechazar la propuesta.
          </p>
        </div>

        {/* Trade Details Breakdown */}
        <div className="space-y-3">
          {/* What they offer you */}
          <div className="bg-slate-950/80 border border-emerald-900/40 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Recibís de {initiator?.name || 'su parte'}:
            </span>
            <div className="space-y-1.5 pl-1">
              {pendingTrade.offeredCash > 0 && (
                <div className="flex items-center gap-2 text-sm font-black text-emerald-300 font-mono">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  + {pendingTrade.offeredCash.toLocaleString()} € en efectivo
                </div>
              )}
              {pendingTrade.offeredPropertyIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pendingTrade.offeredPropertyIds.map((pId) => {
                    const prop = PROPERTY_MAP.get(pId);
                    if (!prop) return null;
                    return (
                      <span
                        key={pId}
                        style={{ borderLeftColor: prop.groupColor }}
                        className="px-2 py-1 bg-slate-900 border-l-4 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {prop.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                pendingTrade.offeredCash === 0 && (
                  <span className="text-xs text-slate-500 italic">Sin propiedades ni dinero</span>
                )
              )}
            </div>
          </div>

          {/* What they ask from you */}
          <div className="bg-slate-950/80 border border-amber-900/40 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Entregás a cambio:
            </span>
            <div className="space-y-1.5 pl-1">
              {pendingTrade.requestedCash > 0 && (
                <div className="flex items-center gap-2 text-sm font-black text-amber-300 font-mono">
                  <Coins className="w-4 h-4 text-amber-400" />
                  - {pendingTrade.requestedCash.toLocaleString()} € en efectivo
                </div>
              )}
              {pendingTrade.requestedPropertyIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pendingTrade.requestedPropertyIds.map((pId) => {
                    const prop = PROPERTY_MAP.get(pId);
                    if (!prop) return null;
                    return (
                      <span
                        key={pId}
                        style={{ borderLeftColor: prop.groupColor }}
                        className="px-2 py-1 bg-slate-900 border-l-4 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {prop.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                pendingTrade.requestedCash === 0 && (
                  <span className="text-xs text-slate-500 italic">Sin escrituras pedidas</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Balance Warning if insufficient cash */}
        {!canAfford && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              Saldo insuficiente. Tenés <b>{currentPlayer.balance} €</b> y te piden{' '}
              <b>{pendingTrade.requestedCash} €</b>.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleRespond(false)}
            className="py-3 px-4 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 border border-slate-700 hover:border-red-800 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            <span>Rechazar</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || !canAfford}
            onClick={() => handleRespond(true)}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Aceptar Trueque</span>
          </button>
        </div>
      </div>
    </div>
  );
};
