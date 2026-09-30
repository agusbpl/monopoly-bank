import React, { useState } from 'react';
import {
  X,
  Building2,
  Landmark,
  ArrowRight,
  Plus,
  Minus,
  Coins,
  DollarSign,
  Search,
  Check,
} from 'lucide-react';
import type { Game, Player } from '../types/game';
import {
  MONOPOLY_PROPERTIES,
  calculateRent,
  ownsCompleteGroup,
} from '../data/monopolyProperties';
import type { PropertyDefinition } from '../data/monopolyProperties';
import { playCoinsSound, playTransferSound, playBuzzerSound, triggerHaptic } from '../utils/sound';
import confetti from 'canvas-confetti';

interface PropertyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  currentPlayer: Player;
  onBuyFromBank: (propertyId: string) => Promise<void>;
  onBuyFromPlayer: (sellerId: string, propertyId: string, agreedPrice: number) => Promise<void>;
  onBuildHouse: (propertyId: string) => Promise<void>;
  onSellHouse: (propertyId: string) => Promise<void>;
  onMortgage: (propertyId: string) => Promise<void>;
  onUnmortgage: (propertyId: string) => Promise<void>;
  onPayRent: (ownerId: string, amount: number, propertyName: string) => Promise<void>;
}

export const PropertyManagerModal: React.FC<PropertyManagerModalProps> = ({
  isOpen,
  onClose,
  game,
  currentPlayer,
  onBuyFromBank,
  onBuyFromPlayer,
  onBuildHouse,
  onSellHouse,
  onMortgage,
  onUnmortgage,
  onPayRent,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'bank' | 'others'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Trade / buy from player modal state
  const [tradingProperty, setTradingProperty] = useState<PropertyDefinition | null>(null);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const propertiesState = game.properties || {};

  const filteredProperties = MONOPOLY_PROPERTIES.filter((prop) => {
    const state = propertiesState[prop.id] || { ownerId: null, houses: 0, isMortgaged: false };
    const isMine = state.ownerId === currentPlayer.id;
    const isBank = state.ownerId === null;
    const isOther = !isMine && !isBank;

    // Filter tab
    if (filterTab === 'mine' && !isMine) return false;
    if (filterTab === 'bank' && !isBank) return false;
    if (filterTab === 'others' && !isOther) return false;

    // Group filter
    if (selectedGroup !== 'all' && prop.group !== selectedGroup) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return prop.name.toLowerCase().includes(q) || prop.groupName.toLowerCase().includes(q);
    }

    return true;
  });

  const handleBuyFromBank = async (propertyId: string) => {
    try {
      setIsSubmitting(true);
      await onBuyFromBank(propertyId);
      playCoinsSound();
      triggerHaptic('success');
      confetti({ particleCount: 40, spread: 50 });
    } catch (err: unknown) {
      playBuzzerSound();
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTrade = async () => {
    if (!tradingProperty) return;
    const state = propertiesState[tradingProperty.id];
    if (!state?.ownerId) return;

    if (agreedPrice <= 0) {
      alert('Ingresá un precio válido acordado');
      return;
    }

    if (currentPlayer.balance < agreedPrice) {
      playBuzzerSound();
      alert(`Saldo insuficiente. Tenés ${currentPlayer.balance} €`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onBuyFromPlayer(state.ownerId, tradingProperty.id, agreedPrice);
      playCoinsSound();
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 60 });
      setTradingProperty(null);
    } catch (err: unknown) {
      playBuzzerSound();
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupsList = [
    { id: 'all', label: 'Todos' },
    { id: 'brown', label: 'Marrón' },
    { id: 'light_blue', label: 'Celeste' },
    { id: 'pink', label: 'Rosa' },
    { id: 'orange', label: 'Naranja' },
    { id: 'red', label: 'Rojo' },
    { id: 'yellow', label: 'Amarillo' },
    { id: 'green', label: 'Verde' },
    { id: 'dark_blue', label: 'Azul' },
    { id: 'railroad', label: 'Estaciones' },
    { id: 'utility', label: 'Servicios' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Propiedades y Alquileres</h3>
              <p className="text-xs text-slate-400">
                Tu saldo:{' '}
                <b className="text-emerald-400 font-mono font-bold">{currentPlayer.balance} €</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and search */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 space-y-2.5">
          {/* Main filter tabs */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`py-1.5 rounded-lg transition ${
                filterTab === 'all' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('mine')}
              className={`py-1.5 rounded-lg transition ${
                filterTab === 'mine' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mis Títulos
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('bank')}
              className={`py-1.5 rounded-lg transition ${
                filterTab === 'bank' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              En el Banco
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('others')}
              className={`py-1.5 rounded-lg transition ${
                filterTab === 'others'
                  ? 'bg-amber-400 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              De otros
            </button>
          </div>

          {/* Search input */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar propiedad de España..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Color group chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {groupsList.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                  selectedGroup === g.id
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Cards List */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No se encontraron propiedades con ese filtro
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const state = propertiesState[prop.id] || {
                ownerId: null,
                houses: 0,
                isMortgaged: false,
              };
              const isMine = state.ownerId === currentPlayer.id;
              const isBank = state.ownerId === null;
              const ownerPlayer = state.ownerId ? game.players[state.ownerId] : null;
              const currentRent = calculateRent(prop.id, propertiesState);
              const hasMonopoly = state.ownerId
                ? ownsCompleteGroup(propertiesState, state.ownerId, prop.group)
                : false;

              return (
                <div
                  key={prop.id}
                  className={`bg-slate-950/80 border rounded-2xl overflow-hidden transition shadow-sm ${
                    isMine
                      ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                      : state.isMortgaged
                      ? 'border-red-900/60 opacity-80'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Color Banner */}
                  <div
                    className="h-3 w-full"
                    style={{ backgroundColor: prop.groupColor }}
                  />

                  <div className="p-3 space-y-3">
                    {/* Top Row: Name, Group, Price & Ownership Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-white text-sm leading-tight">
                            {prop.name}
                          </h4>
                          {state.isMortgaged && (
                            <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[9px] font-bold uppercase">
                              Hipotecada
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {prop.groupName} • Precio: {prop.price} €
                        </span>
                      </div>

                      {/* Owner pill */}
                      <div className="text-right shrink-0">
                        {isBank ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold">
                            <Landmark className="w-3 h-3 text-slate-400" />
                            Banco
                          </span>
                        ) : isMine ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold">
                            <span>{currentPlayer.token}</span>
                            Tuya
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-950/60 border border-blue-800 text-blue-300 rounded-lg text-[10px] font-bold">
                            <span>{ownerPlayer?.token}</span>
                            {ownerPlayer?.name || 'Otro'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rent & Building indicators */}
                    <div className="p-2 bg-slate-900/90 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Alquiler actual:
                        </span>
                        <span
                          className={`font-mono font-extrabold ${
                            state.isMortgaged ? 'text-red-400 line-through' : 'text-emerald-400'
                          }`}
                        >
                          {state.isMortgaged ? '0 € (Hipotecada)' : `${currentRent} €`}
                        </span>
                        {hasMonopoly && state.houses === 0 && (
                          <span className="text-[9px] text-amber-300 block font-semibold">
                            (Monopolio: x2 alquiler base)
                          </span>
                        )}
                      </div>

                      {/* Houses / Hotel status */}
                      {prop.houseCost > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Edificación:
                          </span>
                          <div className="flex items-center gap-1 font-bold text-xs">
                            {state.houses === 0 ? (
                              <span className="text-slate-500 text-[11px]">Sin edificar</span>
                            ) : state.houses === 5 ? (
                              <span className="text-red-400 flex items-center gap-1 text-xs">
                                🏨 Hotel
                              </span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1 text-xs">
                                🏠 {state.houses} {state.houses === 1 ? 'Casa' : 'Casas'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS (State-dependent) */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {/* Case 1: In the Bank -> Direct buy button */}
                      {isBank && (
                        <button
                          type="button"
                          disabled={isSubmitting || currentPlayer.balance < prop.price}
                          onClick={() => handleBuyFromBank(prop.id)}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Comprar al Banco por {prop.price} €</span>
                        </button>
                      )}

                      {/* Case 2: Owned by Me -> Manage buildings & mortgage */}
                      {isMine && (
                        <div className="w-full space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Build / Sell House */}
                            {prop.houseCost > 0 && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    isSubmitting ||
                                    !hasMonopoly ||
                                    state.isMortgaged ||
                                    state.houses >= 5 ||
                                    currentPlayer.balance < prop.houseCost
                                  }
                                  onClick={() => onBuildHouse(prop.id)}
                                  title={
                                    !hasMonopoly
                                      ? 'Necesitas todas las del grupo para edificar'
                                      : 'Construir casa/hotel'
                                  }
                                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>
                                    {state.houses === 4
                                      ? `Hotel (${prop.houseCost} €)`
                                      : `Casa (${prop.houseCost} €)`}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isSubmitting || state.houses <= 0}
                                  onClick={() => onSellHouse(prop.id)}
                                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                                >
                                  <Minus className="w-3.5 h-3.5 text-red-400" />
                                  <span>Vender ({Math.floor(prop.houseCost / 2)} €)</span>
                                </button>
                              </>
                            )}

                            {/* Mortgage / Unmortgage */}
                            {!state.isMortgaged ? (
                              <button
                                type="button"
                                disabled={isSubmitting || state.houses > 0}
                                onClick={() => onMortgage(prop.id)}
                                className="py-1.5 px-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 disabled:opacity-40 text-red-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                              >
                                <Landmark className="w-3.5 h-3.5 text-red-400" />
                                <span>Hipotecar (+{prop.mortgageValue} €)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  isSubmitting ||
                                  currentPlayer.balance < Math.round(prop.mortgageValue * 1.1)
                                }
                                onClick={() => onUnmortgage(prop.id)}
                                className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 disabled:opacity-40 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>
                                  Deshipotecar (-{Math.round(prop.mortgageValue * 1.1)} €)
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Case 3: Owned by another player -> Pay rent or buy/trade */}
                      {!isMine && !isBank && ownerPlayer && (
                        <div className="w-full grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={
                              isSubmitting ||
                              state.isMortgaged ||
                              currentPlayer.balance < currentRent
                            }
                            onClick={async () => {
                              try {
                                setIsSubmitting(true);
                                await onPayRent(ownerPlayer.id, currentRent, prop.name);
                                playTransferSound();
                                triggerHaptic('success');
                              } catch (err: unknown) {
                                playBuzzerSound();
                                alert(err instanceof Error ? err.message : String(err));
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            className="py-2 px-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pagar Alquiler ({currentRent} €)</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting || state.houses > 0}
                            onClick={() => {
                              setTradingProperty(prop);
                              setAgreedPrice(prop.price);
                            }}
                            className="py-2 px-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                            <span>Comprar a {ownerPlayer.name}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Trade/Buy from player sub-modal dialog */}
        {tradingProperty && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md p-6 flex flex-col justify-center items-center z-50 animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Negociación de Propiedad
                </span>
                <h4 className="text-lg font-black text-white">{tradingProperty.name}</h4>
                <p className="text-xs text-slate-400">
                  Dueño actual:{' '}
                  <b>{game.players[propertiesState[tradingProperty.id]?.ownerId || '']?.name}</b>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Precio de compra acordado:</span>
                  <span className="text-slate-400">
                    Tu saldo: <b className="text-emerald-400 font-mono">{currentPlayer.balance} €</b>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
                    €
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={agreedPrice || ''}
                    onChange={(e) => setAgreedPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTradingProperty(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || agreedPrice <= 0 || agreedPrice > currentPlayer.balance}
                  onClick={handleConfirmTrade}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg transition"
                >
                  Confirmar Compra
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
