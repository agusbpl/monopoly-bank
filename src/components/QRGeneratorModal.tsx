import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, DollarSign } from 'lucide-react';
import type { Game, Player, QRPayload } from '../types/game';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  currentPlayer: Player;
}

export const QRGeneratorModal = ({
  isOpen,
  onClose,
  game,
  currentPlayer,
}: QRGeneratorModalProps) => {
  const [requestedAmount, setRequestedAmount] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const payload: QRPayload = {
    type: 'monopoly_pay',
    gameId: game.id,
    recipientId: currentPlayer.id,
    recipientName: currentPlayer.name,
    recipientToken: currentPlayer.token,
    ...(typeof requestedAmount === 'number' && requestedAmount > 0
      ? { amount: requestedAmount }
      : {}),
    ...(reason.trim() ? { reason: reason.trim() } : {}),
  };

  const qrValue = JSON.stringify(payload);
  const quickAmounts = [50, 100, 150, 200, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Mi Código QR para Cobrar</h3>
              <p className="text-xs text-slate-400">Mostrá este código para recibir dinero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-center">
          {/* Player Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full">
            <span className="text-2xl">{currentPlayer.token}</span>
            <span className="font-bold text-sm text-white">{currentPlayer.name}</span>
            <span className="text-xs text-emerald-400 font-mono">({currentPlayer.balance} €)</span>
          </div>

          {/* QR Code Presentation Box */}
          <div className="bg-white p-4 rounded-3xl shadow-xl inline-block mx-auto border-4 border-amber-400">
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="H"
              includeMargin={false}
              className="rounded-xl"
            />
          </div>

          {/* Dynamic Details Indicator */}
          {typeof requestedAmount === 'number' && requestedAmount > 0 ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl">
              <p className="text-xs text-emerald-300 font-medium">
                Cobro configurado por:{' '}
                <b className="text-xl font-mono text-emerald-400 font-bold block mt-0.5">
                  {requestedAmount} €
                </b>
                {reason && <span className="text-[11px] text-slate-300 italic">"{reason}"</span>}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Cualquiera que escanee este QR podrá elegir cuánto transferirte.
            </p>
          )}

          {/* Amount and Concept Configurator */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-left space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Fijar monto a cobrar (opcional):
              </label>
              {requestedAmount !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    setRequestedAmount('');
                    setReason('');
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
                €
              </span>
              <input
                type="number"
                min="1"
                value={requestedAmount}
                onChange={(e) =>
                  setRequestedAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Monto libre"
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setRequestedAmount(q)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    requestedAmount === q
                      ? 'bg-amber-400 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q} €
                </button>
              ))}
            </div>

            {/* Reason input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Motivo / Alquiler de propiedad:
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Alquiler de Paseo del Prado..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
