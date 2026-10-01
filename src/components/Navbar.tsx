import { useState } from 'react';
import { Landmark, History, LogOut, Copy, Check, Building2 } from 'lucide-react';
import type { Game, Player } from '../types/game';

interface NavbarProps {
  game: Game;
  currentPlayer: Player;
  onOpenProperties: () => void;
  onOpenHistory: () => void;
  onOpenBank: () => void;
  onLeaveGame: () => void;
}

export const Navbar = ({
  game,
  currentPlayer,
  onOpenProperties,
  onOpenHistory,
  onOpenBank,
  onLeaveGame,
}: NavbarProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myPropertiesCount = Object.values(game.properties || {}).filter(
    (p) => p.ownerId === currentPlayer.id
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: Room Code & Token */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            title="Copiar código de sala"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition group"
          >
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
              {game.id}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 group-hover:text-white" />
            )}
          </button>

          {currentPlayer.isBanker && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg uppercase">
              Banca
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenProperties}
            title="Propiedades y Alquileres"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-amber-400 transition relative"
          >
            <Building2 className="w-4 h-4" />
            {myPropertiesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black rounded-full text-[9px] font-black flex items-center justify-center">
                {myPropertiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBank}
            title="Operaciones de Banco"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-amber-400 transition"
          >
            <Landmark className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            title="Historial de transacciones"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-blue-400 transition relative"
          >
            <History className="w-4 h-4" />
            {game.transactions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {game.transactions.length > 99 ? '99+' : game.transactions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onLeaveGame}
            title="Salir de la sala"
            className="p-2 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/60 rounded-xl text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
