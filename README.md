# RVStrangers 🎴

> **Deep questions. Real connections.**  
> A turn-based social conversation card game inspired by *We're Not Really Strangers* and *Rabble*, powered by React, Tailwind CSS, Cloudflare Workers, and Cloudflare D1.

🌐 **Live Web App & Edge API:** [https://worker.aitherjamstudio.workers.dev](https://worker.aitherjamstudio.workers.dev)

---

## ✨ Features

- **Onboarding & Authentication:**
  - **Continue with Google:** One-tap OAuth with full access to online matchmaking, friends, chat, and cloud-saved wallet balances.
  - **Continue as Guest:** Instant zero-signup access for local multiplayer games.
  - **Session Persistence:** Returning players bypass the welcome screen automatically; guest temporary sessions are preserved.
- **Game Modes:**
  - **Local Multiplayer (P2P / LAN):** Join existing rooms using 6-character room codes or scan room QR codes. Hosting rooms is reserved for registered members.
  - **Online Stranger Matchmaking:** Algorithmic pairing with thoughtful strangers worldwide.
- **Interactive 3D Game Table:**
  - 3D perspective flippable prompt cards with smooth Y-axis rotation animations.
  - 90-second conversational turn timer.
  - In-game text answer submission with character counters and floating emoji reaction effects.
- **Card Catalog & Economy:**
  - 10 curated decks spanning *Deep Conversations*, *Relationships*, *Mind & Psychology*, *Friends & Fun*, and premium decks.
  - Dual-currency virtual wallet: **Coins (🪙)** earned via gameplay/rewarded ads and **Diamonds (💎)** for premium decks.
- **Edge-Native Microservice Backend:**
  - Distributed serverless compute on **Cloudflare Workers**.
  - 3 isolated **Cloudflare D1** serverless SQLite databases:
    - `rvstrangers-db`: User profiles, wallets, transactions, friendships, and reports.
    - `rvstrangers-cards`: Decks, prompt questions, translations, and deck ownership.
    - `rvstrangers-messages`: Direct 1-on-1 private messages.
  - **Cloudflare R2** bucket for media asset storage.

---

## 🎨 UI Design System

- **Palette (Neon Purple Theme):**
  - Primary: `#5B0DAD`
  - Accent / Highlight: `#C026D3`
  - Dark Surface / Background: `#1A052B` / `#11031D`
  - Light Contrast: `#F6EEFF` / `#FFFFFF`
  - Text Primary: `#1F1726` / `#FFFFFF`
- **Typography:** Google Font **Comfortaa** (weights 300 to 700) applied globally.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone https://github.com/aitherjamstudio/RVStrangers.git
cd RVStrangers

# Install frontend dependencies
npm install

# Start local frontend development server
npm run dev
```

### Backend & Cloudflare Deployment

```bash
# Navigate to backend directory
cd backend

# Deploy to Cloudflare Workers with Static Assets
npx wrangler deploy
```

---

## 📁 Repository Structure

```
RVStrangers/
├── src/                    # React Frontend
│   ├── components/         # UI Views & Modals (Dashboard, GameTable, Friends, Store, Welcome)
│   ├── services/           # API Client Service
│   ├── store/              # Zustand Global Game & Auth Store
│   ├── App.tsx             # Main App Router & Root
│   └── main.tsx            # React Mount Point
├── backend/                # Cloudflare Workers Edge API
│   ├── src/index.ts        # Worker Fetch Handler & Multi-D1 Router
│   ├── migrations/         # D1 Database SQL Schemas & Seeds
│   └── wrangler.toml       # Cloudflare Bindings (D1, R2, Assets)
├── public/                 # Static Assets (Logo & Favicon)
├── Img/                    # Original Design Assets & Branding
├── Notes/                  # Specifications, Blueprints & Activity Logs
│   └── Log/ACTIVITY_LOG.md # Full Chronological Activity Log
└── vite.config.ts          # Vite Configuration
```

---

## 📄 License

MIT License. Designed & developed with ❤️ by the RVStrangers team.
