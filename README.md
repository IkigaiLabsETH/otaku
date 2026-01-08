# Ikigai Studio Research Tools

An extended fork of the **Otaku AI Agent** repo, built on **ElizaOS**. This repository serves dual purposes for Ikigai Studio:

1. **Core Crypto-Native Foundation** — Production-ready plugins for market data, DeFi analytics, on-chain operations, wallet interactions, bridging, and swaps. These power quantitative agents with direct API access to CoinGecko, DeFiLlama, Deribit, Etherscan, Relay, and more.

2. **Multi-Agent Research Swarm** — A TypeScript-native swarm of up to 32 specialized agents for autonomous crypto market research. Quantitative heavy lifting (prices, flows, metrics, skew, liquidity) with shared state, persistent memory, scheduled insights, and **Slack-native interface** (no dashboard required). Structured outputs feed directly into Grok for qualitative synthesis and X discourse layering.

The original Otaku web frontend (React + CDP wallet) remains fully functional and useful for prototyping interactive agents, testing plugins, or building user-facing tools. For our private research workflow, we primarily run the swarm server-only with Slack integration — quantitative autonomy in a dedicated workspace.

## Features

- **Multi-Agent Swarm** — Up to 32 domain specialists (prices, DeFi TVL, on-chain flows, derivatives, macro, institutional signals, etc.)
- **Slack-Native Interface** — Each specialist in its own channel (#coingecko-insights, #deribit-derivs, #swarm-coordinator); @mentions for queries, threaded reports, scheduled notifications
- **Shared Persistent State** — Postgres/plugin-sql for multi-year series, cycle tables, inter-agent handoffs, regime overlays
- **Autonomous Operation** — Self-maintaining fetches, schema validation, anomaly detection, statistical processing
- **Crypto Plugin Suite** (inherited & extended from Otaku)
  - Real-time prices & trending (CoinGecko)
  - TVL & protocol analytics (DeFiLlama)
  - Options skew & funding (Deribit — add your own plugin)
  - On-chain verification (Etherscan)
  - Bridging (Relay)
  - Web search & news
- **Optional Web Frontend** — Modern React UI with CDP wallet integration, chat interface, dashboard — retained for plugin testing, interactive prototypes, or public-facing agents
- **DeFi Actions** (available if frontend/wallet enabled) — Swaps, transfers, bridging, NFT ops via CDP
- **Real-time Communication** — Socket.IO (web) or Slack events (swarm mode)

## Architecture

Monorepo with Bun/Turbo:

- **Runtime**: Bun 1.2.21+
- **Framework**: ElizaOS + Otaku extensions
- **Frontend** (optional): React 18 + TypeScript + Vite + Tailwind + Radix UI
- **Backend**: Custom ElizaOS server
- **Swarm Orchestration**: index.ts + coordinator.ts + specialists/ directory
- **Interface Options**: Web UI (default Otaku) **or** Slack client adapter (research swarm)

### Project Structure (extended from original Otaku)

```
├── src/
│   ├── index.ts                  # Entry: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # New: Swarm coordinator (routing, aggregation, scheduling)
│   ├── specialists/              # New: One file per research specialist (coingeckoSpecialist.ts, etc.)
│   ├── character.ts              # Original Otaku character + optional swarm variants
│   ├── frontend/                 # Retained React app (chat, dashboard, CDP wallet)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── auth/
│   │   │   └── ui/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── types/
│   ├── plugins/                  # Core crypto plugins (extended as needed)
│   │   ├── plugin-cdp/
│   │   ├── plugin-coingecko/
│   │   ├── plugin-defillama/
│   │   ├── plugin-relay/
│   │   ├── plugin-etherscan/
│   │   ├── plugin-web-search/
│   │   └── plugin-bootstrap/
│   └── utils/                    # Shared helpers (charts, regime logic)
├── dist/
├── build.ts
├── start-server.ts
├── vite.config.ts
├── tailwind.config.js
├── turbo.json
└── package.json
```

## Prerequisites

- Bun 1.2.21+
- Node.js 18+ (compatibility)
- Optional: Coinbase Developer Platform keys (for wallet features)
- For swarm: Private Slack workspace + bot tokens
- API keys for data sources
- For Eliza Cloud deployment: ElizaOS CLI (`bunx @elizaos/cli` or global install)

## Running Locally

### Standard Otaku Mode (Web UI + Single Agent)

```bash
bun install
cp .env.sample .env
# Fill required keys (JWT_SECRET, AI provider, CDP if using wallet)
bun run dev
```

Visit http://localhost:3000 for the React chat/dashboard.

### Research Swarm Mode (Slack-Native, Multi-Agent)

Add Slack variables to .env:

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

Enable specialists in src/index.ts (uncomment swarm loading)  
Create Slack channels and invite bot  
Run:

```bash
bun run dev
```

Swarm connects to Slack; specialists post to channels, respond to mentions.  
You can run both modes simultaneously if desired (web for testing, Slack for research).

### Available Scripts

- `bun run dev` - Build and start development server
- `bun run dev:watch` - Watch mode with auto-rebuild
- `bun run build` - Build for production (all packages + frontend)
- `bun run build:all` - Build all workspace packages via Turbo
- `bun run build:backend` - Build backend only
- `bun run build:frontend` - Build frontend only
- `bun run start` - Start production server
- `bun run type-check` - Check TypeScript types

## Plugins

### CDP Plugin (plugin-cdp)

Coinbase Developer Platform integration providing wallet and payment functionality.

Actions:
- USER_WALLET_INFO
- CHECK_TOKEN_BALANCE
- USER_WALLET_TOKEN_TRANSFER
- USER_WALLET_NFT_TRANSFER
- USER_WALLET_SWAP
- FETCH_WITH_PAYMENT

Features:
- Automatic wallet creation
- Multi-chain support
- x402 protocol support

### CoinGecko Plugin (plugin-coingecko)

Real-time prices, market data, trending.

### Web Search Plugin (plugin-web-search)

Tavily + CoinDesk news.

### DeFiLlama Plugin (plugin-defillama)

TVL and protocol analytics.

### Relay Plugin (plugin-relay)

Cross-chain bridging.

### Etherscan Plugin (plugin-etherscan)

Transaction verification.

### Bootstrap & SQL Plugins

Core ElizaOS capabilities + persistent storage.

(Add new research plugins like Deribit, CryptoQuant, Glassnode free tier as needed.)

## Customization

### Using Original Otaku Features

Edit character.ts, add plugins, use frontend — everything from the original repo works unchanged.

### Building the Research Swarm

- Add specialists in src/specialists/ (unique prompts, domain plugins)
- Register in index.ts loading array
- Configure channel routing in coordinator
- Prompts should output structured JSON/tables for easy Grok handoff

### Adding New Plugins

Follow pattern in src/plugins/. Ideal for new data sources.

## Deployment Options

### Option 1: Eliza Cloud (Managed Hosting — Recommended for Quick Production)

Eliza Cloud provides dedicated, production-grade hosting for ElizaOS agents with a single command. Perfect for running the full web app or the Slack-native swarm 24/7 with zero infrastructure management.

Why Eliza Cloud?
- Deploy in ~5 minutes
- Dedicated EC2 instance (not shared)
- Automatic HTTPS, health monitoring, zero-downtime updates
- Real-time logs and easy management via CLI

Quick Start  
Sign up at elizacloud.ai  
Install/login CLI:

```bash
elizaos login
```

Deploy:

```bash
elizaos deploy --project-name ikigai-swarm
```

Passing Secrets (Slack tokens, API keys, etc.)

```bash
elizaos deploy --project-name ikigai-swarm \
  --env "SLACK_BOT_TOKEN=xoxb-..." \
  --env "SLACK_SIGNING_SECRET=..." \
  --env "POSTGRES_URL=postgresql://..." \
  --env "OPENAI_API_KEY=sk-..."
```

Scaling Resources (if needed for heavy swarm)

```bash
elizaos deploy --project-name ikigai-swarm \
  --cpu 1792 \
  --memory 1792 \
  --desired-count 1
```

Management  
- List: `elizaos containers list`
- Logs: `elizaos containers logs --follow`
- Update: Re-run `elizaos deploy` (zero downtime)
- Delete: `elizaos containers delete --project-name ikigai-swarm`

Your agent runs at https://{userId}-ikigai-swarm.containers.elizacloud.ai (web mode) or connects directly to Slack (swarm mode).

### Option 2: Self-Hosted (Railway, Fly.io, VPS, etc.)

For full control:
- Build: `bun run build`
- Start: `bun run start`
- Set env vars (Slack tokens, Postgres, etc.)
- Use Railway templates or generic Docker deploy

Follow original Otaku Railway guide for web app deployment.

### Option 3: Swarm-Only (Server + Slack)

Deploy backend only (disable frontend build if desired). Works on any platform supporting Bun/Node.

## Troubleshooting

(See original Otaku troubleshooting — all issues remain relevant.)  
Common Eliza Cloud issues:
- Ensure Docker is running locally for builds
- Verify API keys/secrets are passed correctly
- Check credits in Eliza Cloud dashboard

## Boundaries & Philosophy

Quantitative layer (swarm) handles data engineering. Qualitative edge (X discourse, contrarian framing) remains Grok-exclusive.  
Original DeFi actions/wallet features preserved for flexibility.  
Core edge: public data + curated X network + Grok synthesis.

## License

MIT

## Acknowledgements

- Original Otaku by Shaw Walters and elizaOS contributors
- Extended for Ikigai Studio quantitative research
- ElizaOS: https://github.com/elizaos/eliza
- Slack client: @elizaos-plugins/client-slack
- Managed hosting: Eliza Cloud

© 2026 Ikigai Studio. All original Otaku features retained and extended. Small edges compound.
