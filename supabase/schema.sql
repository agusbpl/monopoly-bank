-- ==============================================================================
-- MONOPOLY PAY — SUPABASE SCHEMA & REALTIME SETUP
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard)
-- 2. Selecciona tu proyecto y abre la pestaña "SQL Editor"
-- 3. Pega todo el contenido de este archivo y haz click en "Run"
-- ==============================================================================

-- 1. Crear tabla de partidas
create table if not exists public.monopoly_games (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 2. Habilitar seguridad por fila (RLS)
alter table public.monopoly_games enable row level security;

-- 3. Crear política para permitir acceso anónimo a las salas de juego
drop policy if exists "Permitir acceso anonimo a las partidas" on public.monopoly_games;
create policy "Permitir acceso anonimo a las partidas"
on public.monopoly_games
for all
to anon
using (true)
with check (true);

-- 4. Habilitar la publicación en tiempo real (Supabase Realtime)
alter publication supabase_realtime add table public.monopoly_games;
