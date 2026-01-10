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
```
### Project Structure

```
├── src/
│   ├── index.ts                  # Entry point: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # Swarm coordinator: routing, aggregation, scheduling, regime synthesis
│   ├── specialists/              # Research specialists — each file contains a self-contained, modular prompt system 
│   │                             # with detailed 2026 BTC regime analysis templates (33 prompts total across 10+ specialists)
│   │   ├── fundamentalsSpecialist.ts     # Price/ratio fundamentals (CoinGecko, ratios, valuation models)
│   │   ├── defiFlowsSpecialist.ts        # DeFi & wrapped BTC flows (DefiLlama, Artemis)
│   │   ├── liquiditySpecialist.ts        # Liquidity depth & market microstructure (DEX Screener, Kaiko)
│   │   ├── onChainHealthSpecialist.ts    # On-chain health metrics (CryptoQuant, Glassnode, Dune, CoinMetrics, IntoTheBlock, BitInfoCharts)
│   │   ├── derivativesSpecialist.ts      # Derivatives leverage & positioning (Coinglass, CME, Bitfinex, Deribit, Skew)
│   │   ├── socialPsychologySpecialist.ts # Social & crowd psychology (X/Twitter, Santiment, LunarCrush)
│   │   ├── institutionalSpecialist.ts    # Institutional demand signals (ETF flows, CME, Arkham, Nansen)
│   │   ├── macroOverlaysSpecialist.ts     # Macro overlays & external regime drivers (FRED, IMF, Zillow, rates, housing)
│   │   ├── cycleContextSpecialist.ts      # Historical cycle context & research synthesis (Substack, Binance Research, The Block)
│   │   ├── polymarketSpecialist.ts       # Sentiment hedging & prediction markets (Polymarket odds, election/geopolitical overlays)
│   │   └── regimeAggregatorSpecialist.ts # Optional: final synthesis specialist that combines all outputs
│   ├── character.ts              # Core Otaku character definition + swarm personality variants
│   ├── frontend/                 # Retained React app (chat interface, dashboard, CDP wallet integration)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── chat/             # Chat UI, message streaming, specialist selection
│   │   │   ├── dashboard/        # Regime dashboard, charts, signal visualizations
│   │   │   ├── agents/           # Agent cards, status indicators, swarm view
│   │   │   ├── auth/             # Auth flows
│   │   │   └── ui/               # Shared UI components
│   │   ├── lib/                  # API clients, utilities
│   │   ├── hooks/                # Custom React hooks
│   │   ├── contexts/             # Global state (auth, swarm, regime)
│   │   └── types/                # TypeScript interfaces
│   ├── plugins/                  # Core data-fetching plugins (extended for new data sources)
│   │   ├── plugin-cdp/
│   │   ├── plugin-coingecko/
│   │   ├── plugin-defillama/
│   │   ├── plugin-relay/
│   │   ├── plugin-etherscan/
│   │   ├── plugin-web-search/    # Used heavily for sources without dedicated APIs
│   │   ├── plugin-bootstrap/
│   │   ├── plugin-cryptoquant/   # Added for on-chain health
│   │   ├── plugin-glassnode/     # Added for on-chain health
│   │   ├── plugin-coinglass/     # Added for derivatives
│   │   ├── plugin-santiment/     # Added for social signals
│   │   ├── plugin-arkham/        # Added for institutional flows
│   │   ├── plugin-polymarket/    # Added for prediction markets
│   │   └── plugin-dune/          # Added for custom on-chain queries
│   └── utils/                    # Shared helpers: chart generation, regime scoring logic, prompt utilities
├── dist/
├── build.ts
├── start-server.ts
├── vite.config.ts
├── tailwind.config.js
├── turbo.json
└── package.json
```

#### Key Updates
- **specialists/** now explicitly lists the 10+ core research specialists, each backed by highly refined, modular prompt templates optimized for 2026 BTC regime analysis.
- Total of **33 self-contained prompts** distributed across these specialists for comprehensive multi-angle coverage.
- Added new plugins for high-signal data sources that have reliable APIs; remaining sources fall back to `plugin-web-search` or scheduled scrapers.
- `regimeAggregatorSpecialist.ts` added as optional final layer for cross-specialist synthesis.
```
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

#### Example: Polymarket Specialist

This specialist pulls BTC sentiment data from Polymarket, focusing on prediction market odds to gauge short-, mid-, and long-term price expectations.

**Prompt Design:**

> 8. Polymarket (for short, mid, and long-term BTC price predictions)
>
> You are an AI data puller for Ikigai Studio, tapping Polymarket for BTC sentiment checks via prediction odds—killer for short (next few days), mid (week/month), and long-term (quarter/year) vibes. Use browse_page on polymarket.com or API endpoints (instructions: “Extract BTC price markets like ‘BTC >$50k by Jan 15?’, odds, volumes for horizons: short (1-3 days), mid (1-4 weeks), long (1-12 months). Summarize implied probabilities.”). Or web_search for “Polymarket BTC predictions.” Code_execution to process: calculate sentiment score (e.g., avg bull odds). Output markdown: - Short-Term: “70% odds BTC > current in 3 days—bullish lean.” - Mid-Term: [list odds] - Long-Term: “Sentiment at 60% for $100k EOY.” Weave as market expectation proxy, cross-check multiples.

**Daily Output Example (as of January 10, 2026 — current BTC spot ≈ $91,000):**

> **Short-Term (next few days):** 
> - 89% implied probability Bitcoin closes January 10 in the $90,000–$92,000 range (high-volume daily range market).
> - Probabilities decline gradually over the coming week (65% for Jan 11, down to ~20–30% by Jan 15–16 staying in that tight range), reflecting growing uncertainty.
> - Only 8% odds of dipping below $88,000 during January 5–11 period.
> - Intraday “Up or Down” intervals today trading ~50–54% Up.
> 
> Overall short-term sentiment neutral-to-mildly bullish — market expects stability around current levels with very low downside risk and balanced intraday moves.
> 
> [polymarket.com](https://polymarket.com/crypto)
> 
> Cross-checks across daily range ladders, “above X” binaries (100% above $80k today), and weekly hit markets ($3m+ volume) confirm high conviction against any near-term crash.
> 
> **Mid-Term (week/month):** 
> - 60% odds Bitcoin reaches >$95,000 at any point in January ( flagship monthly hit market, $18m volume, $3m liquidity).
> 
> Mid-term sentiment moderately bullish — market assigns solid probability of upside push above current ~$91k by month-end, implying expectations of recovery or continued grind higher.
> 
> [polymarket.com](https://polymarket.com/crypto)
> 
> High volume and liquidity signal strong consensus and active hedging around January thresholds.
> 
> **Long-Term (quarter/year):** 
> - 84% odds Bitcoin hits >$100,000 at some point in 2026.
> - ~9% odds to reach >$200,000 in 2026.
> - ~4–5% odds to reach >$250,000 in 2026.
> - Only 10% chance of a new all-time high by March 31, 2026 (Q1 end).
> 
> Long-term sentiment moderately optimistic — strong base-case expectation of at least modest new highs (>100k) over the full year, but priced-in skepticism on early parabolic moves or extreme levels.
> 
> [polymarket.com](https://polymarket.com/crypto)
> 
> Ladder-style binary markets ($5m+ total volume) provide consistent cross-check: high certainty on six-figure prices, rapidly decaying odds for 2x+ from here.

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
