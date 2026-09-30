# AGENTS.md — Monopoly Pay Context for AI Agents

Welcome to **Monopoly Pay** (`monopoly-bank`). This file documents the complete architectural, operational, and domain context so any future AI agent or human developer can immediately understand and extend this project without reverse-engineering.

---

## 1. Project Overview & Live Environment

- **Purpose**: Mobile-first digital banker and property management companion for Monopoly (official Spain / Madrid edition). Eliminates physical money using instant QR-code transfers, WebSockets synchronization, synthesized Web Audio sound effects, and full property transaction mechanics.
- **Production URL**: [https://monopoly-bank-two.vercel.app](https://monopoly-bank-two.vercel.app)
- **Deployment Platform**: Vercel (Scope / Team: `agusbpl`, Project: `monopoly-bank`).
- **Database / Realtime**: Supabase (`https://xhvxftvwifeiywzwwckn.supabase.co`).
- **Local Path**: `/home/spogus/Projects/monopoly-bank`

---

## 2. Technology Stack

- **Runtime & Bundler**: Node.js v26 + Vite 8.3 + TypeScript 6.0
- **Frontend Framework**: React 19 (SPA / PWA-ready)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, imported via `@import "tailwindcss";` in `src/index.css`)
- **QR Code Engine**:
  - Scanning: `html5-qrcode` (rear camera WebRTC with manual player fallback)
  - Generation: `qrcode.react` (vector SVG)
- **Realtime / Persistence**:
  - Cloud: `@supabase/supabase-js` (PostgreSQL with Supabase Realtime publication)
  - Local Fallback: `BroadcastChannel` (cross-tab sync) + `localStorage`
- **Audio & Haptics**: Pure Web Audio API synthesizers (`src/utils/sound.ts`) + `navigator.vibrate` (zero external mp3 assets needed)
- **Icons & Effects**: `lucide-react`, `canvas-confetti`

---

## 3. Architecture & Codebase Map

```
/home/spogus/Projects/monopoly-bank/
├── public/
│   └── favicon.svg                     # Monopoly top hat SVG icon
├── src/
│   ├── data/
│   │   └── monopolyProperties.ts       # All 28 official Spain properties, rents, and rules engine
│   ├── types/
│   │   └── game.ts                     # Game, Player, Transaction, PropertyState, QRPayload types
│   ├── services/
│   │   ├── supabase.ts                 # Supabase client setup with active credential detection
│   │   └── gameService.ts              # Core business logic (transfers, bank, properties, realtime sync)
│   ├── utils/
│   │   └── sound.ts                    # Web Audio API synthesizers (coins, pass GO fanfare, transfers, buzzer)
│   ├── components/
│   │   ├── Lobby.tsx                   # Game creation (M-XXXX code) and joining screen
│   │   ├── Navbar.tsx                  # Sticky header with room code, property count badge, action buttons
│   │   ├── GameDashboard.tsx           # Player balance card, pass GO button, QR actions, players list
│   │   ├── PropertyManagerModal.tsx    # Property deed cards, buying, trading, houses/hotels, mortgages
│   │   ├── QRScannerModal.tsx          # Camera scanner with automatic parsing and direct transfer form
│   │   ├── QRGeneratorModal.tsx        # Dynamic QR display with optional preset amount and reason
│   │   ├── BankModal.tsx               # Quick taxes, bail, house purchase, chance card payments
│   │   ├── TransactionHistoryModal.tsx # Realtime audit ledger of all game transactions
│   │   └── SupabaseGuideModal.tsx      # In-app setup instructions and SQL script
│   ├── App.tsx                         # Main state coordinator, session restore, and modal routing
│   ├── index.css                       # Tailwind v4 setup & custom dark-theme scrollbars
│   └── main.tsx                        # Application entry point
├── supabase/
│   └── schema.sql                      # SQL migration creating `monopoly_games` table with RLS & Realtime
├── .env                                # Local Supabase credentials (git-ignored)
├── .env.example                        # Template for environment variables
├── vercel.json                         # SPA routing rewrite rule (`/(.*)` -> `/index.html`)
└── vite.config.ts                      # Vite configuration with React and Tailwind v4 plugins
```

---

## 4. Official Monopoly Spain Domain Rules (Madrid Edition)

All property names, groups, prices, rents, and taxes adhere to the official Spanish board:

### A. Board Properties (28 Total)
- **Marrón**: Ronda de Valencia (60 €), Plaza Lavapiés (60 €) — Casas: 50 €
- **Celeste**: Glorieta Cuatro Caminos (100 €), Av. Reina Victoria (100 €), Calle Bravo Murillo (120 €) — Casas: 50 €
- **Rosa**: Glorieta de Bilbao (140 €), Calle Alberto Aguilera (140 €), Calle Fuencarral (160 €) — Casas: 100 €
- **Naranja**: Av. Felipe II (180 €), Calle Velázquez (180 €), Calle Serrano (200 €) — Casas: 100 €
- **Rojo**: Av. de América (220 €), Calle María de Molina (220 €), Calle Cea Bermúdez (240 €) — Casas: 150 €
- **Amarillo**: Av. Reyes Católicos (260 €), Calle Bailén (260 €), Plaza de España (280 €) — Casas: 150 €
- **Verde**: Puerta del Sol (300 €), Calle Alcalá (300 €), Gran Vía (320 €) — Casas: 200 €
- **Azul Oscuro**: Paseo de la Castellana (350 €), Paseo del Prado (400 €) — Casas: 200 €
- **Estaciones (200 € c/u)**: Goya, Las Delicias, Mediodía, Norte (Alquiler: 25€ con 1, 50€ con 2, 100€ con 3, 200€ con 4)
- **Servicios (150 € c/u)**: Compañía de Electricidad, Compañía de Aguas (Alquiler: 4x dados con 1, 10x dados con 2)

### B. Property Actions & Rents
- **Bank Purchase**: Player pays deed face value; owner becomes player.
- **Rival Trade / Purchase**: Players can transfer unmortgaged, unimproved properties at any negotiated price.
- **Monopoly Rent Doubling**: Owning all properties of a color group automatically doubles unimproved street rent.
- **Houses & Hotels**: 1 to 4 houses, upgrade to Hotel (level 5) when group is complete. Selling gives 50% refund.
- **Mortgage**: Owner receives 50% of purchase price; rent is 0 € while mortgaged.
- **Unmortgage**: Owner pays mortgage value + 10% interest back to Bank.
- **Taxes**:
  - Impuesto sobre el Capital: 200 €
  - Impuesto de Lujo: 100 €
  - Fianza de Cárcel: 50 €
  - Paso por Salida: 200 €

---

## 5. Synchronization & Data Persistence

1. **Supabase Realtime Mode**:
   - When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, `GameService` saves game state via `upsert` on the `monopoly_games` table.
   - All subscribed clients receive instant updates via postgres changes channel (`room_${gameId}`).
2. **Local Fallback Mode**:
   - If Supabase is unreachable or not configured, state is stored in `localStorage` (`monopoly_game_${gameId}`) and synced across browser tabs using `BroadcastChannel`.

---

## 6. Development & Deployment Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Start local dev server
pnpm dev

# 3. Production TypeScript & Vite build test
pnpm build

# 4. Deploy directly to Vercel production
vercel deploy --yes --prod
```

---

## 7. Active Credentials & Vercel Config

- **Supabase Project URL**: `https://xhvxftvwifeiywzwwckn.supabase.co`
- **Publishable Key**: `sb_publishable_4zoRaJoxppyMUgWlnmVFOA_vPO_vqSn`
- Configured in `.env`, `.env.local`, and permanently in Vercel project environment variables (`agusbpl/monopoly-bank`).
- Git branches follow conventional commits (`feat:`, `chore:`, `docs:`, etc.) without AI attribution or `Co-Authored-By`.
