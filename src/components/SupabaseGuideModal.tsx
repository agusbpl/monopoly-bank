import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SQL_SCRIPT = `-- 1. Tabla de partidas para Monopoly Pay
create table if not exists public.monopoly_games (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.monopoly_games enable row level security;

-- 3. Crear política para permitir lectura y escritura anónima a las salas
create policy "Permitir acceso anonimo a las partidas"
on public.monopoly_games
for all
to anon
using (true)
with check (true);

-- 4. Habilitar Supabase Realtime para que los cambios se sincronicen en vivo
alter publication supabase_realtime add table public.monopoly_games;
`;

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Conexión con Supabase</h3>
              <p className="text-xs text-slate-400">Paso a paso para sincronizar múltiples celulares</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isSupabaseConfigured
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full shrink-0 animate-ping ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <div>
              <p className="font-bold text-sm">
                {isSupabaseConfigured
                  ? 'Supabase Conectado (Tiempo Real Activo)'
                  : 'Modo Local / BroadcastChannel Activo'}
              </p>
              <p className="text-[11px] text-slate-300">
                {isSupabaseConfigured
                  ? 'Las transferencias se sincronizan entre todos los teléfonos conectados a internet.'
                  : 'Actualmente sincroniza entre pestañas del mismo navegador. Para jugar entre varios teléfonos en la mesa, seguí estos 3 pasos:'}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-extrabold text-[11px]">
                    1
                  </span>
                  Crear proyecto gratis en Supabase
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Ir a Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-400 text-[11px]">
                Iniciá sesión en Supabase y hacé click en <b>"New Project"</b> (elegí la región más cercana, ej. São Paulo).
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-extrabold text-[11px]">
                    2
                  </span>
                  Ejecutar el script SQL
                </span>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-slate-400 text-[11px]">
                Andá a la pestaña <b>SQL Editor</b> en tu proyecto de Supabase, pegá el código y dale a <b>Run</b>. Crea la tabla con Realtime habilitado.
              </p>
              <pre className="p-2.5 bg-slate-900 rounded-xl text-[10px] text-slate-300 font-mono overflow-x-auto max-h-24">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-extrabold text-[11px]">
                  3
                </span>
                Pegar las Variables en Vercel
              </span>
              <p className="text-slate-400 text-[11px]">
                En Supabase andá a <b>Project Settings → API</b> y copiá tu URL y tu Clave anónima (*anon public*). Luego en tu proyecto de Vercel andá a <b>Settings → Environment Variables</b> y agregá:
              </p>
              <div className="space-y-1 font-mono text-[10px] text-amber-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <p>VITE_SUPABASE_URL=https://xyz.supabase.co</p>
                <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
