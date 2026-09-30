import React, { useState } from 'react';
import { X, Landmark, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Player } from '../types/game';
import { playCoinsSound, playTransferSound, playBuzzerSound, triggerHaptic } from '../utils/sound';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  onTransfer: (fromId: string, toId: string, amount: number, reason?: string) => Promise<void>;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onTransfer,
}) => {
  const [mode, setMode] = useState<'pay_bank' | 'collect_bank'>('pay_bank');
  const [amount, setAmount] = useState<number>(50);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const quickPayRules = [
    { label: 'Cárcel ($50)', amount: 50, reason: 'Fianza para salir de la cárcel' },
    { label: 'Impuesto de Lujo ($75)', amount: 75, reason: 'Impuesto de lujo' },
    { label: 'Impuesto Capital ($100)', amount: 100, reason: 'Impuesto sobre el capital' },
    { label: 'Comprar Casa ($50)', amount: 50, reason: 'Compra de 1 casa' },
    { label: 'Comprar Casa ($100)', amount: 100, reason: 'Compra de 1 casa' },
    { label: 'Comprar Hotel ($200)', amount: 200, reason: 'Compra de hotel' },
  ];

  const quickCollectRules = [
    { label: 'Premio Belleza ($10)', amount: 10, reason: 'Segundo premio en concurso de belleza' },
    { label: 'Devolución Impuestos ($20)', amount: 20, reason: 'Devolución de impuestos' },
    { label: 'Error Banca ($200)', amount: 200, reason: 'Error de la banca a tu favor' },
    { label: 'Cobrar Hipoteca ($100)', amount: 100, reason: 'Cobro por hipoteca de propiedad' },
    { label: 'Cobro Salida ($200)', amount: 200, reason: 'Paso por la Salida' },
  ];

  const handleSubmit = async () => {
    if (amount <= 0) {
      playBuzzerSound();
      alert('Ingresá un monto válido');
      return;
    }

    if (mode === 'pay_bank' && currentPlayer.balance < amount) {
      playBuzzerSound();
      triggerHaptic('warning');
      alert(`Saldo insuficiente. Tenés $${currentPlayer.balance}`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'pay_bank') {
        await onTransfer(currentPlayer.id, 'bank', amount, reason || 'Pago al Banco');
        playTransferSound();
      } else {
        await onTransfer('bank', currentPlayer.id, amount, reason || 'Cobro del Banco');
        playCoinsSound();
      }
      triggerHaptic('success');
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      playBuzzerSound();
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Operaciones con el Banco</h3>
              <p className="text-xs text-slate-400">Impuestos, propiedades o premios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-4 pb-0">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('pay_bank');
                setReason('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                mode === 'pay_bank'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-red-400" />
              <span>Pagar al Banco</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('collect_bank');
                setReason('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                mode === 'collect_bank'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Cobrar del Banco</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>{mode === 'pay_bank' ? 'Monto a pagar:' : 'Monto a cobrar:'}</span>
              <span className="text-slate-400">
                Tu saldo: <b className="text-emerald-400 font-mono">${currentPlayer.balance}</b>
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                $
              </span>
              <input
                type="number"
                min="1"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-2xl font-bold text-white focus:outline-none focus:border-amber-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* Preset rules chips */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accesos rápidos Monopoly:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(mode === 'pay_bank' ? quickPayRules : quickCollectRules).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setAmount(item.amount);
                    setReason(item.reason);
                  }}
                  className="p-2 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-semibold text-white block truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">{item.reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Concepto (opcional):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Compra de Ferrocarril, Suerte..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Submit button */}
          <button
            type="button"
            disabled={isSubmitting || amount <= 0 || (mode === 'pay_bank' && amount > currentPlayer.balance)}
            onClick={handleSubmit}
            className={`w-full py-4 text-black font-extrabold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 ${
              mode === 'pay_bank'
                ? 'bg-red-400 hover:bg-red-300 shadow-red-500/20'
                : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
            }`}
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : mode === 'pay_bank' ? (
              <>
                <span>Pagar ${amount} al Banco</span>
                <ArrowUpRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Cobrar ${amount} del Banco</span>
                <ArrowDownLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
