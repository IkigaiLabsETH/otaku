Ikigai Studio Research ToolsAn extended fork of the Otaku AI Agent repo, built on ElizaOS. This repository serves dual purposes for Ikigai Studio:Core Crypto-Native Foundation — Production-ready plugins for market data, DeFi analytics, on-chain operations, wallet interactions, bridging, and swaps. These power quantitative agents with direct API access to CoinGecko, DeFiLlama, Deribit, Etherscan, Relay, and more.
Multi-Agent Research Swarm — A TypeScript-native swarm of specialized agents for autonomous crypto market research. The swarm is explicitly divided into two distinct categories:BTC-Centric Specialists: Deep, quantitative focus on Bitcoin regime analysis, cycle metrics, and macro overlays (33 refined prompt templates).
Altcoin Research Specialists: Qualitative and discovery-oriented workflows tailored for altcoin evaluation, sentiment, narratives, and risk management (8 key prompt templates).

Features shared state, persistent memory, scheduled insights, and a Slack-native interface (no dashboard required). Structured outputs feed directly into Grok for final qualitative synthesis and X discourse layering.

The original Otaku web frontend (React + CDP wallet) remains fully functional and useful for prototyping interactive agents, testing plugins, or building user-facing tools. For our private research workflow, we primarily run the swarm server-only with Slack integration — full quantitative and qualitative autonomy in a dedicated workspace.FeaturesMulti-Agent Swarm — 19 specialized agents (11 BTC-centric + 8 altcoin-focused) providing comprehensive coverage of Bitcoin regimes and altcoin opportunities
Slack-Native Interface — Each specialist in its own channel (e.g., #btc-onchain-health, #alt-sentiment, #gem-hunter, #swarm-coordinator); @mentions
 for queries, threaded reports, scheduled notifications
Shared Persistent State — Postgres/plugin-sql for multi-year series, cycle tables, inter-agent handoffs, regime overlays
Autonomous Operation — Self-maintaining fetches, schema validation, anomaly detection, statistical processing
Crypto Plugin Suite (inherited & extended from Otaku)Real-time prices & trending (CoinGecko)
TVL & protocol analytics (DeFiLlama)
Options skew & funding (Deribit — add your own plugin)
On-chain verification (Etherscan)
Bridging (Relay)
Web search & news

Optional Web Frontend — Modern React UI with CDP wallet integration, chat interface, dashboard — retained for plugin testing, interactive prototypes, or public-facing agents
DeFi Actions (available if frontend/wallet enabled) — Swaps, transfers, bridging, NFT ops via CDP
Real-time Communication — Socket.IO (web) or Slack events (swarm mode)

ArchitectureMonorepo with Bun/Turbo:Runtime: Bun 1.2.21+
Framework: ElizaOS + Otaku extensions
Frontend (optional): React 18 + TypeScript + Vite + Tailwind + Radix UI
Backend: Custom ElizaOS server
Swarm Orchestration: index.ts + coordinator.ts + specialists/ directory
Interface Options: Web UI (default Otaku) or Slack client adapter (research swarm)

Specialists OverviewThe swarm is deliberately separated into two categories with distinct prompt design philosophies:BTC-Centric Specialists (33 refined prompt templates)Deep quantitative focus on Bitcoin-specific regimes, on-chain health, derivatives, institutional flows, and macro context. These agents are optimized for cycle analysis and regime detection in 2026+ Bitcoin markets.fundamentalsSpecialist.ts — Price/ratio fundamentals (CoinGecko, ratios, valuation models)
defiFlowsSpecialist.ts — DeFi & wrapped BTC flows (DefiLlama, Artemis)
liquiditySpecialist.ts — Liquidity depth & market microstructure (DEX Screener, Kaiko)
onChainHealthSpecialist.ts — On-chain health metrics (CryptoQuant, Glassnode, Dune, CoinMetrics, IntoTheBlock, BitInfoCharts)
derivativesSpecialist.ts — Derivatives leverage & positioning (Coinglass, CME, Bitfinex, Deribit, Skew)
socialPsychologySpecialist.ts — Social & crowd psychology (X/Twitter, Santiment, LunarCrush)
institutionalSpecialist.ts — Institutional demand signals (ETF flows, CME, Arkham, Nansen)
macroOverlaysSpecialist.ts — Macro overlays & external regime drivers (FRED, IMF, Zillow, rates, housing)
cycleContextSpecialist.ts — Historical cycle context & research synthesis (Substack, Binance Research, The Block)
polymarketSpecialist.ts — Sentiment hedging & prediction markets (Polymarket odds, election/geopolitical overlays)
regimeAggregatorSpecialist.ts — Final BTC regime synthesis (combines all BTC-centric outputs)

Altcoin Research Specialists (8 key prompt templates)Qualitative, discovery-oriented templates designed specifically for altcoin workflows: sentiment tracking, gem hunting, project due diligence, narrative detection, and risk avoidance. These complement the BTC core with actionable altcoin edge.altSentimentSpecialist.ts — Real-time X sentiment analysis for altcoins/projects
gemHunterSpecialist.ts — Early-stage altcoin gem discovery with 100x screening
projectAssessorSpecialist.ts — Professional-grade evaluation of any altcoin project
whaleMonitorSpecialist.ts — Whale movements and smart-money tracking across altcoins
tradeTimingSpecialist.ts — Entry/exit timing and position management for altcoins
narrativeDetectorSpecialist.ts — Detecting narrative shifts and emerging trends in altcoins
portfolioDesignerSpecialist.ts — Diversified portfolio construction with altcoin allocation
scamGuardSpecialist.ts — Scam/rug-pull detection and avoidance framework

Project Structureplaintext

├── src/
│   ├── index.ts                  # Entry point: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # Swarm coordinator: routing, aggregation, scheduling, regime synthesis
│   ├── specialists/              # Research specialists (BTC-centric + altcoin-focused, 41 prompts total)
│   │   # BTC-Centric (33 prompts)
│   │   ├── fundamentalsSpecialist.ts
│   │   ├── defiFlowsSpecialist.ts
│   │   ├── liquiditySpecialist.ts
│   │   ├── onChainHealthSpecialist.ts
│   │   ├── derivativesSpecialist.ts
│   │   ├── socialPsychologySpecialist.ts
│   │   ├── institutionalSpecialist.ts
│   │   ├── macroOverlaysSpecialist.ts
│   │   ├── cycleContextSpecialist.ts
│   │   ├── polymarketSpecialist.ts
│   │   └── regimeAggregatorSpecialist.ts
│   │   # Altcoin Research (8 prompts)
│   │   ├── altSentimentSpecialist.ts
│   │   ├── gemHunterSpecialist.ts
│   │   ├── projectAssessorSpecialist.ts
│   │   ├── whaleMonitorSpecialist.ts
│   │   ├── tradeTimingSpecialist.ts
│   │   ├── narrativeDetectorSpecialist.ts
│   │   ├── portfolioDesignerSpecialist.ts
│   │   └── scamGuardSpecialist.ts
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
│   │   ├── plugin-web-search/
│   │   ├── plugin-bootstrap/
│   │   ├── plugin-cryptoquant/
│   │   ├── plugin-glassnode/
│   │   ├── plugin-coinglass/
│   │   ├── plugin-santiment/
│   │   ├── plugin-arkham/
│   │   ├── plugin-polymarket/
│   │   └── plugin-dune/
│   └── utils/                    # Shared helpers: chart generation, regime scoring logic, prompt utilities
├── dist/
├── build.ts
├── start-server.ts
├── vite.config.ts
├── tailwind.config.js
├── turbo.json
└── package.json

Key UpdatesClear architectural separation between BTC-centric quantitative regime agents (33 prompts across 11 specialists) and altcoin-focused qualitative/discovery agents (8 prompts across 8 specialists)
Total of 41 self-contained prompts across 19 specialists
regimeAggregatorSpecialist.ts enhanced to synthesize both BTC regime signals and altcoin opportunity outputs
All altcoin specialists built around battle-tested Grok prompt templates adapted for autonomous agent execution
Added new plugins for high-signal data sources; remaining sources fall back to plugin-web-search or scheduled scrapers

PrerequisitesBun 1.2.21+
Node.js 18+ (compatibility)
Optional: Coinbase Developer Platform keys (for wallet features)
For swarm: Private Slack workspace + bot tokens
API keys for data sources
For Eliza Cloud deployment: ElizaOS CLI (bunx @elizaos/cli or global install)

Running LocallyStandard Otaku Mode (Web UI + Single Agent)bash

bun install
cp .env.sample .env
# Fill required keys (JWT_SECRET, AI provider, CDP if using wallet)
bun run dev

Visit http://localhost:3000 for the React chat/dashboard.Research Swarm Mode (Slack-Native, Multi-Agent)Add Slack variables to .env:

SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

Enable specialists in src/index.ts (uncomment swarm loading)
Create Slack channels and invite bot
Run:bash

bun run dev

Swarm connects to Slack; specialists post to channels, respond to mentions.
You can run both modes simultaneously if desired (web for testing, Slack for research).Available Scriptsbun run dev - Build and start development server
bun run dev:watch - Watch mode with auto-rebuild
bun run build - Build for production (all packages + frontend)
bun run build:all - Build all workspace packages via Turbo
bun run build:backend - Build backend only
bun run build:frontend - Build frontend only
bun run start - Start production server
bun run type-check - Check TypeScript types

PluginsCDP Plugin (plugin-cdp)Coinbase Developer Platform integration providing wallet and payment functionality.Actions:USER_WALLET_INFO
CHECK_TOKEN_BALANCE
USER_WALLET_TOKEN_TRANSFER
USER_WALLET_NFT_TRANSFER
USER_WALLET_SWAP
FETCH_WITH_PAYMENT

Features:Automatic wallet creation
Multi-chain support
x402 protocol support

CoinGecko Plugin (plugin-coingecko)Real-time prices, market data, trending.Web Search Plugin (plugin-web-search)Tavily + CoinDesk news.DeFiLlama Plugin (plugin-defillama)TVL and protocol analytics.Relay Plugin (plugin-relay)Cross-chain bridging.Etherscan Plugin (plugin-etherscan)Transaction verification.Bootstrap & SQL PluginsCore ElizaOS capabilities + persistent storage.(Add new research plugins like Deribit, CryptoQuant, Glassnode free tier as needed.)CustomizationUsing Original Otaku FeaturesEdit character.ts, add plugins, use frontend — everything from the original repo works unchanged.Building the Research SwarmAdd specialists in src/specialists/ (follow BTC or altcoin prompt design patterns)
Register in index.ts loading array
Configure channel routing in coordinator
Prompts should output structured JSON/tables for easy Grok handoff

Adding New PluginsFollow pattern in src/plugins/. Ideal for new data sources.Deployment OptionsOption 1: Eliza Cloud (Managed Hosting — Recommended for Quick Production)Eliza Cloud provides dedicated, production-grade hosting for ElizaOS agents with a single command. Perfect for running the full web app or the Slack-native swarm 24/7 with zero infrastructure management.Why Eliza Cloud?Deploy in ~5 minutes
Dedicated EC2 instance (not shared)
Automatic HTTPS, health monitoring, zero-downtime updates
Real-time logs and easy management via CLI

Quick Start
Sign up at elizacloud.ai
Install/login CLI:bash

elizaos login

Deploy:bash

elizaos deploy --project-name ikigai-swarm

Passing Secrets (Slack tokens, API keys, etc.)bash

elizaos deploy --project-name ikigai-swarm \
  --env "SLACK_BOT_TOKEN=xoxb-..." \
  --env "SLACK_SIGNING_SECRET=..." \
  --env"Come "POSTGRES_URL=postgresql://..." \
  --env "OPENAI_API_KEY=sk-..."

Scaling Resources (if needed for heavy swarm)bash

elizaos deploy --project-name ikigai-swarm \
  --cpu 1792 \
  --memory 1792 \
  --desired-count 1

Management  List: elizaos containers list
Logs: elizaos containers logs --follow
Update: Re-run elizaos deploy (zero downtime)
Delete: elizaos containers delete --project-name ikigai-swarm

Your agent runs at https://{userId}-ikigai-swarm.containers.elizacloud.ai (web mode) or connects directly to Slack (swarm mode).Option 2: Self-Hosted (Railway, Fly.io, VPS, etc.)For full control:Build: bun run build
Start: bun run start
Set env vars (Slack tokens, Postgres, etc.)
Use Railway templates or generic Docker deploy

Follow original Otaku Railway guide for web app deployment.Option 3: Swarm-Only (Server + Slack)Deploy backend only (disable frontend build if desired). Works on any platform supporting Bun/Node.Troubleshooting(See original Otaku troubleshooting — all issues remain relevant.)
Common Eliza Cloud issues:Ensure Docker is running locally for builds
Verify API keys/secrets are passed correctly
Check credits in Eliza Cloud dashboard

Boundaries & PhilosophyBTC Layer: Quantitative, regime-focused, data-heavy
Altcoin Layer: Qualitative, discovery-focused, narrative-aware
Final qualitative edge (X discourse, contrarian framing, synthesis) remains Grok-exclusive
Original DeFi actions/wallet features preserved for flexibility
Core edge: public data + curated X network + Grok synthesis

Small edges compound.LicenseMITAcknowledgementsOriginal Otaku by Shaw Walters and elizaOS contributors
Extended for Ikigai Studio BTC regime and altcoin research
ElizaOS: https://github.com/elizaos/eliza
Slack client: @elizaos
-plugins/client-slack
Managed hosting: Eliza Cloud

© 2026 Ikigai Studio. All original Otaku features retained and extended. Small edges compound.
