import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, ArrowRight, Send, ArrowLeftRight } from 'lucide-react';
import type { Game, Player, QRPayload, TradeOffer } from '../types/game';
import { playTransferSound, playBuzzerSound, triggerHaptic } from '../utils/sound';
import confetti from 'canvas-confetti';
import { MONOPOLY_PROPERTIES, calculateRent } from '../data/monopolyProperties';
import { TradeBuilderModal } from './TradeBuilderModal';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  currentPlayer: Player;
  initialRecipientId?: string;
  onTransfer: (toId: string, amount: number, reason?: string) => Promise<void>;
  onPayRent?: (ownerId: string, amount: number, propertyName: string, diceRoll?: number) => Promise<void>;
  onCreateTradeOffer?: (offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export const QRScannerModal = ({
  isOpen,
  onClose,
  game,
  currentPlayer,
  initialRecipientId,
  onTransfer,
  onPayRent,
  onCreateTradeOffer,
}: QRScannerModalProps) => {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'properties'>('transfer');
  const [utilityDiceProperty, setUtilityDiceProperty] = useState<string | null>(null);
  const [diceRoll, setDiceRoll] = useState(7);
  const [tradingPropertyId, setTradingPropertyId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setSelectedRecipientId('');
      setCameraError(null);
      setActiveTab('transfer');
      setUtilityDiceProperty(null);
      setTradingPropertyId(null);
      return;
    }

    if (initialRecipientId) {
      setSelectedRecipientId(initialRecipientId);
      setActiveTab('transfer');
    } else {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, initialRecipientId]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      setScanning(true);
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Error starting camera scanner:', errorMsg);
      setCameraError('No se pudo acceder a la cámara. Podés elegir al jugador de la lista abajo.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQRCodeScanned = (decodedText: string) => {
    try {
      const parsed = JSON.parse(decodedText) as QRPayload;
      if (parsed.type === 'monopoly_pay') {
        if (parsed.recipientId === currentPlayer.id) {
          playBuzzerSound();
          triggerHaptic('warning');
          setCameraError('No podés transferirte dinero a vos mismo');
          return;
        }

        stopScanner();
        setSelectedRecipientId(parsed.recipientId);
        if (parsed.amount && parsed.amount > 0) {
          setAmount(parsed.amount);
        }
        if (parsed.reason) {
          setReason(parsed.reason);
        }
        playTransferSound();
        triggerHaptic('success');
      } else {
        throw new Error('QR no reconocido');
      }
    } catch {
      // Fallback: check if text is direct player id
      if (game.players[decodedText] && decodedText !== currentPlayer.id) {
        stopScanner();
        setSelectedRecipientId(decodedText);
        playTransferSound();
        triggerHaptic('success');
      } else {
        setCameraError('El código QR escaneado no pertenece a esta partida');
      }
    }
  };

  const handleConfirmTransfer = async () => {
    const targetId = selectedRecipientId;
    if (!targetId) return;

    if (amount <= 0) {
      playBuzzerSound();
      alert('Ingresá un monto válido mayor a 0');
      return;
    }

    if (currentPlayer.balance < amount) {
      playBuzzerSound();
      triggerHaptic('warning');
      alert(`Saldo insuficiente. Tenés ${currentPlayer.balance} €`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransfer(targetId, amount, reason || 'Transferencia directa');
      playTransferSound();
      triggerHaptic('success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      playBuzzerSound();
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const targetPlayer = game.players[selectedRecipientId];
  const quickAmounts = [50, 100, 150, 200, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-4 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                {selectedRecipientId ? <Send className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{selectedRecipientId ? 'Transferir' : 'Escanear y Pagar'}</h3>
                <p className="text-xs text-slate-400">{selectedRecipientId ? 'Enviá dinero a otro jugador' : 'Apuntá al QR del otro jugador'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {initialRecipientId && selectedRecipientId && (
            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('transfer')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'transfer' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Transferir
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'properties' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Propiedades
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Scanner Viewport */}
          {!selectedRecipientId && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square border-2 border-dashed border-amber-500/40 flex items-center justify-center">
                <div id="qr-reader-container" className="w-full h-full" />
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-amber-400 rounded-2xl animate-pulse" />
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Manual selection fallback */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  O seleccioná un jugador:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(game.players)
                    .filter((p) => p.id !== currentPlayer.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipientId(p.id);
                          stopScanner();
                        }}
                        className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-left flex items-center gap-2 transition"
                      >
                        <span className="text-2xl">{p.token}</span>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-emerald-400 font-mono">{p.balance} €</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Transfer Form (when recipient is selected) */}
          {selectedRecipientId && targetPlayer && activeTab === 'transfer' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Recipient Badge */}
              <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-850 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                    {targetPlayer.token}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Destinatario
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {targetPlayer.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Saldo actual: {targetPlayer.balance} €
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipientId('');
                    startScanner();
                  }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Monto a transferir:</span>
                  <span className="text-slate-400">
                    Tu saldo: <b className="text-emerald-400 font-mono">{currentPlayer.balance} €</b>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                    €
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentPlayer.balance}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-2xl font-bold text-white focus:outline-none focus:border-amber-400"
                    placeholder="0"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        amount === q
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {q} €
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(currentPlayer.balance)}
                    className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 rounded-xl"
                  >
                    Todo
                  </button>
                </div>
              </div>

              {/* Concept / Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Concepto (opcional):
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Alquiler de Paseo del Prado, compra de calle..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                disabled={isSubmitting || amount <= 0 || amount > currentPlayer.balance}
                onClick={handleConfirmTransfer}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-black font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <span>Pagar {amount} € a {targetPlayer.name}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Properties List */}
          {selectedRecipientId && targetPlayer && activeTab === 'properties' && (() => {
            const targetPlayerProperties = MONOPOLY_PROPERTIES.filter(
              (p) => game.properties[p.id]?.ownerId === selectedRecipientId
            );

            if (targetPlayerProperties.length === 0) {
              return (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Este jugador no tiene propiedades.
                </div>
              );
            }

            return (
              <div className="space-y-3 animate-in fade-in duration-200">
                {targetPlayerProperties.map(prop => {
                  const state = game.properties[prop.id];
                  const rentAmount = calculateRent(prop.id, game.properties, diceRoll);
                  const isUtility = prop.group === 'utility';
                  const isMortgaged = state.isMortgaged;
                  const isUtilitySelected = utilityDiceProperty === prop.id;

                  return (
                    <div key={prop.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                      <div className="flex min-h-[52px]">
                        <div className="w-1.5 shrink-0 self-stretch" style={{ backgroundColor: prop.groupColor }} />
                        <div className="flex-1 px-3 py-2 flex items-center justify-between gap-2 min-w-0">
                          <div className="truncate pr-1">
                            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                              {prop.name}
                              {isMortgaged && <span className="text-[10px] font-normal text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-md">(Hipotecada)</span>}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {isMortgaged ? 'No genera alquiler' : isUtility ? 'Requiere dados' : `Alquiler: ${rentAmount} €`}
                              {!isMortgaged && state.houses > 0 && state.houses < 5 && ` • ${state.houses} 🏠`}
                              {!isMortgaged && state.houses === 5 && ` • 🏨`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTradingPropertyId(prop.id)}
                              className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                              title="Intercambiar propiedad"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Intercambiar</span>
                            </button>
                            {isUtility && !isMortgaged ? (
                              <button
                                type="button"
                                onClick={() => setUtilityDiceProperty(isUtilitySelected ? null : prop.id)}
                                className="px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold rounded-lg transition"
                              >
                                {isUtilitySelected ? 'Cancelar' : 'Tirar dados'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isMortgaged || isSubmitting || rentAmount <= 0}
                                onClick={async () => {
                                  if (onPayRent) {
                                    setIsSubmitting(true);
                                    try {
                                      await onPayRent(selectedRecipientId, rentAmount, prop.name);
                                      playTransferSound();
                                      triggerHaptic('success');
                                      onClose();
                                    } catch (err: unknown) {
                                      const errorMsg = err instanceof Error ? err.message : String(err);
                                      playBuzzerSound();
                                      alert(errorMsg);
                                    } finally {
                                      setIsSubmitting(false);
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Utility Inline Dice Roll */}
                      {isUtilitySelected && !isMortgaged && (
                        <div className="px-3 py-3 bg-slate-900 border-t border-slate-700 flex flex-col gap-3 animate-in slide-in-from-top-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Total de los dados:</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="2" max="12" 
                                value={diceRoll} 
                                onChange={(e) => setDiceRoll(Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            disabled={isSubmitting || diceRoll < 2 || diceRoll > 12}
                            onClick={async () => {
                               if (onPayRent) {
                                 setIsSubmitting(true);
                                 try {
                                   await onPayRent(selectedRecipientId, rentAmount, prop.name, diceRoll);
                                   playTransferSound();
                                   triggerHaptic('success');
                                   onClose();
                                 } catch (err: unknown) {
                                   const errorMsg = err instanceof Error ? err.message : String(err);
                                   playBuzzerSound();
                                   alert(errorMsg);
                                 } finally {
                                   setIsSubmitting(false);
                                 }
                               }
                            }}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg transition"
                          >
                            Pagar {rentAmount} €
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Bilateral Trade Builder Dialog Direct */}
      {tradingPropertyId && targetPlayer && onCreateTradeOffer && (
        <TradeBuilderModal
          isOpen={Boolean(tradingPropertyId)}
          onClose={() => setTradingPropertyId(null)}
          game={game}
          currentPlayer={currentPlayer}
          targetPlayer={targetPlayer}
          initialRequestedPropertyId={tradingPropertyId}
          onCreateTradeOffer={async (offer) => {
            await onCreateTradeOffer(offer);
            setTradingPropertyId(null);
          }}
        />
      )}
    </div>
  );
};
