import React, { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { Game, Player, TradeOffer } from '../types/game';
import { MONOPOLY_PROPERTIES } from '../data/monopolyProperties';
import { playTransferSound, playBuzzerSound, triggerHaptic } from '../utils/sound';

interface TradeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  currentPlayer: Player;
  targetPlayer: Player;
  initialRequestedPropertyId?: string;
  onCreateTradeOffer: (offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export const TradeBuilderModal: React.FC<TradeBuilderModalProps> = ({
  isOpen,
  onClose,
  game,
  currentPlayer,
  targetPlayer,
  initialRequestedPropertyId,
  onCreateTradeOffer,
}) => {
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [offeredPropertyIds, setOfferedPropertyIds] = useState<string[]>([]);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [requestedPropertyIds, setRequestedPropertyIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialRequestedPropertyId) {
        const prop = MONOPOLY_PROPERTIES.find((p) => p.id === initialRequestedPropertyId);
        const suggestedOffer = prop ? Math.min(prop.price, currentPlayer.balance) : 0;
        setOfferedCash(suggestedOffer);
        setRequestedPropertyIds([initialRequestedPropertyId]);
      } else {
        setOfferedCash(0);
        setRequestedPropertyIds([]);
      }
      setOfferedPropertyIds([]);
      setRequestedCash(0);
    }
  }, [isOpen, initialRequestedPropertyId, currentPlayer.balance]);

  if (!isOpen) return null;

  const propertiesState = game.properties || {};

  const myTradeableProperties = MONOPOLY_PROPERTIES.filter(
    (p) =>
      propertiesState[p.id]?.ownerId === currentPlayer.id &&
      (propertiesState[p.id]?.houses || 0) === 0
  );

  const targetTradeableProperties = MONOPOLY_PROPERTIES.filter(
    (p) =>
      propertiesState[p.id]?.ownerId === targetPlayer.id &&
      (propertiesState[p.id]?.houses || 0) === 0
  );

  const handleSendOffer = async () => {
    if (
      offeredCash === 0 &&
      requestedCash === 0 &&
      offeredPropertyIds.length === 0 &&
      requestedPropertyIds.length === 0
    ) {
      alert('Debes incluir al menos efectivo o una propiedad en la propuesta');
      return;
    }
    if (offeredCash > currentPlayer.balance) {
      alert(`Saldo insuficiente. Tu saldo es ${currentPlayer.balance} €`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateTradeOffer({
        gameId: game.id,
        initiatorId: currentPlayer.id,
        initiatorName: currentPlayer.name,
        targetId: targetPlayer.id,
        targetName: targetPlayer.name,
        offeredCash,
        offeredPropertyIds,
        requestedCash,
        requestedPropertyIds,
      });
      playTransferSound();
      triggerHaptic('success');
      alert(`¡Oferta enviada a ${targetPlayer.name}! Esperando su confirmación.`);
      onClose();
    } catch (err: unknown) {
      playBuzzerSound();
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center items-center z-[60] animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <div className="inline-flex p-2 bg-amber-500/20 text-amber-400 rounded-xl mb-1">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-black text-white">Propuesta de Trueque</h4>
          <p className="text-xs text-slate-400">
            Negociando con <b className="text-amber-400">{targetPlayer.name}</b>
          </p>
        </div>

        {/* What you offer */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Lo que ofreces (Tú)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Saldo: <b className="text-emerald-400">{currentPlayer.balance} €</b>
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold block">Efectivo ofrecido:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                €
              </span>
              <input
                type="number"
                min="0"
                max={currentPlayer.balance}
                value={offeredCash || ''}
                onChange={(e) => setOfferedCash(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-semibold block">
              Escrituras que entregas ({offeredPropertyIds.length}):
            </label>
            {myTradeableProperties.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No tienes propiedades sin edificar para ofrecer</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                {myTradeableProperties.map((p) => {
                  const isSelected = offeredPropertyIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOfferedPropertyIds((prev) =>
                          isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.groupColor }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* What you request */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Lo que pides ({targetPlayer.name})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Saldo: <b className="text-amber-400">{targetPlayer.balance} €</b>
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold block">Efectivo pedido:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                €
              </span>
              <input
                type="number"
                min="0"
                value={requestedCash || ''}
                onChange={(e) => setRequestedCash(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-semibold block">
              Escrituras pedidas ({requestedPropertyIds.length}):
            </label>
            {targetTradeableProperties.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No tiene propiedades sin edificar disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                {targetTradeableProperties.map((p) => {
                  const isSelected = requestedPropertyIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setRequestedPropertyIds((prev) =>
                          isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.groupColor }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              isSubmitting ||
              offeredCash > currentPlayer.balance ||
              (offeredCash === 0 &&
                requestedCash === 0 &&
                offeredPropertyIds.length === 0 &&
                requestedPropertyIds.length === 0)
            }
            onClick={handleSendOffer}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg transition"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Oferta'}
          </button>
        </div>
      </div>
    </div>
  );
};
