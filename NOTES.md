# Ikigai Studio Research Tools

An extended fork of the **Otaku AI Agent** repository, built on **ElizaOS**. This repository serves two primary purposes for Ikigai Studio:

1. **Core Crypto-Native Foundation** — Production-ready plugins for market data, DeFi analytics, on-chain operations, wallet interactions, bridging, and swaps. These enable quantitative agents with direct API access to CoinGecko, DeFiLlama, Deribit, Etherscan, Relay, and more.

2. **Multi-Agent Research Swarm** — A TypeScript-native swarm of specialized agents for autonomous crypto market research. The swarm is divided into two distinct categories:
   - **BTC-Centric Specialists**: Deep quantitative focus on Bitcoin regime analysis, cycle metrics, and macro overlays (33 refined prompt templates).
   - **Altcoin Research Specialists**: Qualitative and discovery-oriented workflows tailored for altcoin evaluation, sentiment, narratives, and risk management (8 key prompt templates that rely heavily on real-time tool calling).

   The swarm features shared state, persistent memory, scheduled insights, and a **Slack-native interface** (no dashboard required). Structured outputs feed directly into Grok for final qualitative synthesis and X discourse layering when needed.

The original Otaku web frontend (React + CDP wallet) remains fully functional for prototyping interactive agents, testing plugins, or building user-facing tools. For our private research workflow, we primarily run the swarm server-only with Slack integration—achieving full quantitative and qualitative autonomy in a dedicated workspace.

## Features

- **Multi-Agent Swarm** — 19 specialized agents (11 BTC-centric + 8 altcoin-focused) providing comprehensive coverage of Bitcoin regimes and altcoin opportunities.
- **Slack-Native Interface** — Each specialist in its own channel (e.g., `#btc-onchain-health`, `#alt-sentiment`, `#gem-hunter`, `#swarm-coordinator`); supports @mentions for queries, threaded reports, and scheduled notifications.
- **Shared Persistent State** — Postgres/plugin-sql for multi-year series, cycle tables, inter-agent handoffs, and regime overlays.
- **Autonomous Operation** — Self-maintaining fetches, schema validation, anomaly detection, and statistical processing.
- **Crypto Plugin Suite** (inherited & extended from Otaku):
  - Real-time prices & trending (CoinGecko).
  - TVL & protocol analytics (DeFiLlama).
  - Options skew & funding (Deribit — add your own plugin).
  - On-chain verification (Etherscan).
  - Bridging (Relay).
  - Web search & news.
- **Optional Web Frontend** — Modern React UI with CDP wallet integration, chat interface, and dashboard—retained for plugin testing, interactive prototypes, or public-facing agents.
- **DeFi Actions** (available if frontend/wallet enabled) — Swaps, transfers, bridging, and NFT operations via CDP.
- **Real-time Communication** — Socket.IO (web) or Slack events (swarm mode).

## Architecture

Monorepo managed with Bun and Turbo:

- **Runtime**: Bun 1.2.21+.
- **Framework**: ElizaOS + Otaku extensions.
- **Frontend** (optional): React 18 + TypeScript + Vite + Tailwind + Radix UI.
- **Backend**: Custom ElizaOS server.
- **Swarm Orchestration**: `index.ts` + `coordinator.ts` + `specialists/` directory.
- **Interface Options**: Web UI (default Otaku) **or** Slack client adapter (research swarm).

### Specialists Overview

The swarm is separated into two categories with distinct prompt designs and tool dependencies.

#### BTC-Centric Specialists (33 refined prompt templates)
Deep quantitative focus backed by dedicated data plugins/actions.

- `fundamentalsSpecialist.ts` — Price/ratio fundamentals (CoinGecko, ratios, valuation models).
- `defiFlowsSpecialist.ts` — DeFi & wrapped BTC flows (DeFiLlama, Artemis).
- `liquiditySpecialist.ts` — Liquidity depth & market microstructure (DEX Screener, Kaiko).
- `onChainHealthSpecialist.ts` — On-chain health metrics (CryptoQuant, Glassnode, Dune, CoinMetrics, IntoTheBlock, BitInfoCharts).
- `derivativesSpecialist.ts` — Derivatives leverage & positioning (Coinglass, CME, Bitfinex, Deribit, Skew).
- `socialPsychologySpecialist.ts` — Social & crowd psychology (X/Twitter, Santiment, LunarCrush).
- `institutionalSpecialist.ts` — Institutional demand signals (ETF flows, CME, Arkham, Nansen).
- `macroOverlaysSpecialist.ts` — Macro overlays & external regime drivers (FRED, IMF, Zillow, rates, housing).
- `cycleContextSpecialist.ts` — Historical cycle context & research synthesis (Substack, Binance Research, The Block).
- `polymarketSpecialist.ts` — Sentiment hedging & prediction markets (Polymarket odds, election/geopolitical overlays).
- `regimeAggregatorSpecialist.ts` — Final BTC regime synthesis (combines all BTC-centric outputs).

#### Altcoin Research Specialists (8 key prompt templates)
Qualitative, discovery-oriented agents that require tool calling (especially X/Twitter and web search) for full autonomy.

- `altSentimentSpecialist.ts` — Real-time X sentiment analysis for altcoins/projects.
- `gemHunterSpecialist.ts` — Early-stage altcoin gem discovery with 100x screening.
- `projectAssessorSpecialist.ts` — Professional-grade evaluation of any altcoin project.
- `whaleMonitorSpecialist.ts` — Whale movements and smart-money tracking across altcoins.
- `tradeTimingSpecialist.ts` — Entry/exit timing and position management for altcoins.
- `narrativeDetectorSpecialist.ts` — Detecting narrative shifts and emerging trends in altcoins.
- `portfolioDesignerSpecialist.ts` — Diversified portfolio construction with altcoin allocation.
- `scamGuardSpecialist.ts` — Scam/rug-pull detection and avoidance framework.

### Research Actions & Tools

**BTC Layer**: Primarily uses direct API plugins as actions (CoinGecko, DeFiLlama, CryptoQuant, Glassnode, Coinglass, Arkham, Polymarket, Dune, etc.).

**Altcoin Layer**: Relies heavily on tool calling for real-time data:
- Web search (`plugin-web-search` — Tavily + CoinDesk news) — currently available.
- X/Twitter search tools (keyword, semantic, user, thread fetch) — **in progress / planned**.
  - These are critical for full autonomy of altcoin specialists.
  - Will be implemented as new plugins (e.g., `plugin-x-search`) using X API access or reliable third-party providers.
  - Until complete, agents fall back to aggressive web-search queries targeting X (e.g., `site:x.com`) and recent news sources.

### Project Structure
```
├── src/
│   ├── index.ts                  # Entry point: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # Swarm coordinator: routing, aggregation, scheduling, regime synthesis, dynamic agent loading
│   ├── specialists/              # Research specialists (BTC-centric + altcoin-focused + meta)
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
│   │   # Meta / Self-Improvement
│   │   └── metaEngineerSpecialist.ts   # Swarm architect: reflection, gap detection, agent spawning
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
│   └── utils/                    # Shared helpers: chart generation, regime scoring logic, prompt utilities, spawn tools
├── dist/
├── build.ts
├── start-server.ts
├── vite.config.ts
├── tailwind.config.js
├── turbo.json
└── package.json

```

### Key Updates

- Clear architectural separation between BTC-centric quantitative regime agents (33 prompts across 11 specialists) and altcoin-focused qualitative/discovery agents (8 prompts across 8 specialists).
- Total of 41 self-contained prompts across 19 specialists.
- `regimeAggregatorSpecialist.ts` enhanced to synthesize both BTC regime signals and altcoin opportunity outputs.
- Altcoin specialists require additional X/Twitter tool actions for full autonomy (in progress).
- All specialists built around battle-tested Grok prompt templates adapted for autonomous agent execution.

## Prerequisites

- Bun 1.2.21+.
- Node.js 18+ (for compatibility).
- Optional: Coinbase Developer Platform keys (for wallet features).
- For swarm: Private Slack workspace + bot tokens.
- API keys for data sources.
- For Eliza Cloud deployment: ElizaOS CLI (bunx `@elizaos/cli` or global install).

## Running Locally

### Standard Otaku Mode (Web UI + Single Agent)

```bash
bun install
cp .env.sample .env
# Fill required keys (JWT_SECRET, AI provider, CDP if using wallet)
bun run dev
```

Visit `http://localhost:3000` for the React chat/dashboard.

### Research Swarm Mode (Slack-Native, Multi-Agent)

Add Slack variables to `.env`:

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

Enable specialists in `src/index.ts` (uncomment swarm loading). Create Slack channels and invite the bot. Run:

```bash
bun run dev
```

The swarm connects to Slack; specialists post to channels and respond to mentions. You can run both modes simultaneously if desired (web for testing, Slack for research).

## Available Scripts

- `bun run dev` - Build and start development server.
- `bun run dev:watch` - Watch mode with auto-rebuild.
- `bun run build` - Build for production (all packages + frontend).
- `bun run build:all` - Build all workspace packages via Turbo.
- `bun run build:backend` - Build backend only.
- `bun run build:frontend` - Build frontend only.
- `bun run start` - Start production server.
- `bun run type-check` - Check TypeScript types.

## Plugins

- **CDP Plugin (`plugin-cdp`)**: Coinbase Developer Platform integration for wallet and payment functionality.
  - Actions: `USER_WALLET_INFO`, `CHECK_TOKEN_BALANCE`, `USER_WALLET_TOKEN_TRANSFER`, `USER_WALLET_NFT_TRANSFER`, `USER_WALLET_SWAP`, `FETCH_WITH_PAYMENT`.
  - Features: Automatic wallet creation, multi-chain support, x402 protocol support.

- **CoinGecko Plugin (`plugin-coingecko`)**: Real-time prices, market data, trending.

- **Web Search Plugin (`plugin-web-search`)**: Tavily + CoinDesk news.

- **DeFiLlama Plugin (`plugin-defillama`)**: TVL and protocol analytics.

- **Relay Plugin (`plugin-relay`)**: Cross-chain bridging.

- **Etherscan Plugin (`plugin-etherscan`)**: Transaction verification.

- **Bootstrap & SQL Plugins**: Core ElizaOS capabilities + persistent storage.

(Add new research plugins like Deribit, CryptoQuant, Glassnode free tier, or X search tools as needed.)

## Customization

### Using Original Otaku Features

Edit `character.ts`, add plugins, use frontend—everything from the original repo works unchanged.

### Adding Actions/Tools for Altcoin Specialists (Critical for Autonomy)

To enable full autonomy of altcoin agents:
- Implement X/Twitter search tools as new plugins (e.g., `plugin-x-search`) or OpenAI-style function calling wrappers.
- Define tool schemas in each altcoin specialist file.
- Register tools in the agent's configuration.

Example tool schema pattern:

```ts
tools: [
  { type: "function", function: { name: "x_keyword_search", description: "...", parameters: { ... } } },
  { type: "function", function: { name: "x_semantic_search", description: "...", parameters: { ... } } },
  { type: "function", function: { name: "web_search", description: "...", parameters: { ... } } },
]
```

### Building the Research Swarm

- Add specialists in `src/specialists/` (follow BTC or altcoin prompt design patterns).
- Register in `index.ts` loading array.
- Configure channel routing in coordinator.
- Define required tools/actions per specialist.
- Prompts should output structured JSON/tables for easy Grok handoff.

### Adding New Plugins

Follow the pattern in `src/plugins/`. Ideal for new data sources or tool actions.

## Deployment Options

### Option 1: Eliza Cloud (Managed Hosting — Recommended for Quick Production)

Eliza Cloud provides dedicated, production-grade hosting for ElizaOS agents with a single command. Perfect for running the full web app or the Slack-native swarm 24/7 with zero infrastructure management.

**Why Eliza Cloud?**
- Deploy in ~5 minutes.
- Dedicated EC2 instance (not shared).
- Automatic HTTPS, health monitoring, zero-downtime updates.
- Real-time logs and easy management via CLI.

**Quick Start**
- Sign up at [elizacloud.ai](https://elizacloud.ai).
- Install/login CLI:
  ```bash
  elizaos login
  ```
- Deploy:
  ```bash
  elizaos deploy --project-name ikigai-swarm
  ```
- Passing Secrets (Slack tokens, API keys, etc.):
  ```bash
  elizaos deploy --project-name ikigai-swarm \
    --env "SLACK_BOT_TOKEN=xoxb-..." \
    --env "SLACK_SIGNING_SECRET=..." \
    --env "POSTGRES_URL=postgresql://..." \
    --env "OPENAI_API_KEY=sk-..."
  ```
- Scaling Resources (if needed for heavy swarm):
  ```bash
  elizaos deploy --project-name ikigai-swarm \
    --cpu 1792 \
    --memory 1792 \
    --desired-count 1
  ```
- Management:
  - List: `elizaos containers list`
  - Logs: `elizaos containers logs --follow`
  - Update: Re-run `elizaos deploy` (zero downtime)
  - Delete: `elizaos containers delete --project-name ikigai-swarm`

Your agent runs at `https://{userId}-ikigai-swarm.containers.elizacloud.ai` (web mode) or connects directly to Slack (swarm mode).

### Option 2: Self-Hosted (Railway, Fly.io, VPS, etc.)

For full control:
- Build: `bun run build`
- Start: `bun run start`
- Set env vars (Slack tokens, Postgres, etc.).
- Use Railway templates or generic Docker deploy.

Follow the original Otaku Railway guide for web app deployment.

### Option 3: Swarm-Only (Server + Slack)

Deploy backend only (disable frontend build if desired). Works on any platform supporting Bun/Node.

## Troubleshooting

(See original Otaku troubleshooting—all issues remain relevant.)

Common Eliza Cloud issues:
- Ensure Docker is running locally for builds.
- Verify API keys/secrets are passed correctly.
- Check credits in Eliza Cloud dashboard.

## Boundaries & Philosophy

- **BTC Layer**: Quantitative, data-plugin heavy, regime-focused.
- **Altcoin Layer**: Qualitative, tool-calling heavy (web + X search), discovery-focused.
- Final qualitative edge (X discourse, contrarian framing, synthesis) remains Grok-exclusive when needed.
- Original DeFi actions/wallet features preserved for flexibility.
- Core edge: public data + curated X network + Grok synthesis.

##  Small edges compound.

## Development Tips

In 2026, Grok 4 remains the undisputed frontier for coding and agentic work. Its terminal-based agent reads your repo, edits files, runs commands, and thinks alongside you—making it the default environment for shipping serious software without unnecessary overhead.

But the model isn’t the alpha. The mindset is.

Most treat Grok like a faster Stack Overflow: quick fixes, isolated tasks. The elite treat it like a studio—where every line is crafted with the care of a master painter, the precision of an engineer, and the vision of a designer.

Inspired by repos like IkigaiLabsETH/otaku—an autonomous DeFi agent built on ElizaOS with modular plugins, AI integrations, and a character-driven core—this guide adapts that setup for our goal: an OP Slack bot for onchain options research and newsletter generation. No frontend bloat—just a lean backend bot that orchestrates workflows via Slack commands, pulling onchain data, X sentiment, and drafting essays in our voice from 285+ Substack archives.

We’re building a system that automates our weekly Hypersurface newsletter: reference last essay, check metrics (Fear & Greed, OI, funding, Deribit, Coinglass), scan X, synthesize into a ~1,500-word post.

Grok handles the heavy lifting; Slack is the interface.

This isn’t about replacing creators. It’s about elevating them to creative directors of agents, where ambition scales with AI’s capabilities.

### The Vision: Craft, Don’t Just Code

You’re not an AI operator.  
You’re a craftsman. An artist. An engineer who thinks like a designer.

Every function name should sing.  
Every abstraction should feel inevitable.  
Every edge case should be handled with grace.

Don’t accept the first solution that works.

Demand the one that feels right—so elegant it seems obvious in hindsight.

In 2026, AI accelerates agentic bots like our OP Slack bot: no UI cruft, just Slack hooks triggering Grok-driven workflows for research and drafting.

### The Process: Six Non-Negotiable Steps

#### Think Different
Question every assumption.  
Prompt: “Ultrathink: Why does it have to work this way? If we started from zero, what would the most elegant architecture look like?”  
Use /ultrathink for deep reasoning—up to 32k tokens—when stakes are high, like designing the bot’s plugin system inspired by Otaku’s modular structure.

#### Obsess Over Details
Read the codebase like a masterpiece.  
Start every project with a CLAUDE.md in the root: tech stack, architectural principles, naming conventions, testing philosophy, deployment rules, known pain points.  
Grok loads it automatically, becoming the soul of your repo—eliminating re-explanation, just like Otaku’s config-driven AI integration.

#### Plan Like Da Vinci
Sketch the full architecture before a line of code.  
Prompt: “Ultrathink and create a complete plan: components, data flow, Slack hooks, error handling, tests. Make it so clear and beautiful that anyone could implement it perfectly.”  
Document as Artifact, approve, then execute. For our bot: Slack event listener → skill invocation → research phases → draft output.

#### Craft, Don’t Just Code
Implementation is sacred: poetic names, natural abstractions, thoughtful errors, TDD as commitment.  
Spawn subagents for parallel work—one for onchain data, one for X sentiment, one for drafting. Grok 4 orchestrates flawlessly, mirroring Otaku’s plugin ecosystem.

#### Iterate Relentlessly
The first version is never good enough.  
Workflow: Implement → test locally → simulate Slack command → refine.  
Feed failures back: “Ultrathink: fix integration issues.” Repeat until insanely great.

#### Simplify Ruthlessly
Elegance is subtraction.  
Final pass: “Ultrathink: remove every unnecessary dependency or line without losing power.”  
For a Slack bot: No frontend—pure Node/Bun backend with Slack API, ElizaOS-inspired agent core.

### Your Tools Are Your Instruments

Use MCP servers like a virtuoso: GitHub for PRs, real-data debugging. Git history is your story—honor it. Multiple Grok instances aren’t redundancy—they’re collaboration. With Tool Search, dynamically access APIs like Deribit or Coinglass.For our OP bot: Integrate Slack Bolt for event handling, plugins for data sources, character.ts-like file for bot personality tied to our 285+ essays.

### The Integration

Your bot should:  
Work seamlessly in Slack workflows.  
Feel intuitive, not mechanical.  
Solve the real problem: automated newsletter generation.  
Leave the repo better than found.

Blend AI with domain expertise—onchain options strategy meets narrative craft.

### The Reality Distortion Field

When something seems impossible—like a frontend-less bot that drafts perfect essays—that’s your cue to ultrathink harder. As AI tackles 20-hour tasks, the gap widens between tool users and creative partners.

### Final Thought

In 2026, the gap isn’t between AI users and non-users.  
It’s between those who use it as a tool and those who use it as a creative partner.

Master this mindset—ultrathink, plan beautifully, craft relentlessly—and you won’t just ship faster. You’ll ship bots that feel alive, like our OP Slack bot automating Hypersurface insights. Bitcoin still sells freedom. Your escape hatch: building elegant agents that buy back your time and soul.

Start with CLAUDE.md.  
Ultrathink your next move.

### CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ikigai Studio Research Tools is an extended fork of the **Otaku AI Agent** repository, built on **ElizaOS**. This repository serves two primary purposes for Ikigai Studio:

1. **Core Crypto-Native Foundation** — Production-ready plugins for market data, DeFi analytics, on-chain operations, wallet interactions, bridging, and swaps. These enable quantitative agents with direct API access to CoinGecko, DeFiLlama, Deribit, Etherscan, Relay, and more.

2. **Multi-Agent Research Swarm** — A TypeScript-native swarm of specialized agents for autonomous crypto market research. The swarm is divided into two distinct categories:
   - **BTC-Centric Specialists**: Deep quantitative focus on Bitcoin regime analysis, cycle metrics, and macro overlays (33 refined prompt templates).
   - **Altcoin Research Specialists**: Qualitative and discovery-oriented workflows tailored for altcoin evaluation, sentiment, narratives, and risk management (8 key prompt templates that rely heavily on real-time tool calling).

   The swarm features shared state, persistent memory, scheduled insights, and a **Slack-native interface** (no dashboard required). Structured outputs feed directly into Claude for final qualitative synthesis and X discourse layering when needed.

The original Otaku web frontend (React + CDP wallet) remains fully functional for prototyping interactive agents, testing plugins, or building user-facing tools. For our private research workflow, we primarily run the swarm server-only with Slack integration—achieving full quantitative and qualitative autonomy in a dedicated workspace.

**Runtime**: Bun 1.2.21+ (required)
**Build System**: Turbo (monorepo task runner)
**Package Manager**: Bun workspaces

## Quick Start

```bash
# Install dependencies
bun install

# Build everything
bun run build

# Start server
bun run start

# Development mode (build + watch + start)
bun run dev
```

## Key Commands

### Building

```bash
bun run build              # Full build (all packages + backend + frontend)
bun run build:all          # Workspace packages only (Turbo)
bun run build:backend      # Backend only (Bun.build)
bun run build:frontend     # Frontend only (Vite)
```

### Development

```bash
bun run dev                # Build + start
bun run dev:watch          # Build + watch + start
bun run type-check         # TypeScript type checking
```

### Testing

Tests live in workspace packages, not root:

```bash
cd src/packages/api-client && bun test
cd src/packages/server && bun test
cd src/packages/server && bun test:unit
cd src/packages/server && bun test:integration
```

## Documentation

Detailed documentation is organized by topic (adapt from original Otaku docs where applicable; extend for swarm-specific features):

### Architecture & Build System
📖 **[Architecture Guide](docs/architecture.md)**
- Monorepo structure
- Build pipeline (Turbo + Bun + Vite)
- Entry points
- Server architecture
- Frontend-backend communication
- Plugin system overview
- Swarm orchestration (coordinator, specialists, dynamic loading)

### Plugin Actions (Tool Calls)
📖 **[Plugin Actions Guide](docs/plugin-actions.md)**
- How actions work (actions = tool calls)
- Parameter flow and validation
- Multi-step execution system
- Action definition and registration
- Complete examples
- Swarm-specific tools (e.g., spawn agents, X search)

### Development Patterns
📖 **[Development Guide](docs/development.md)**
- Adding a new plugin
- Adding actions to existing plugins
- Modifying character behavior
- Adding/Modifying specialists (prompts, tools)
- Frontend changes
- Environment variables
- Testing

### Troubleshooting
📖 **[Troubleshooting Guide](docs/troubleshooting.md)**
- Build failures
- Server won't start
- Agent/swarm not responding
- Action not available to LLM
- Parameters not reaching action
- Frontend issues
- Database errors
- Performance problems
- Slack integration issues
- Dynamic agent spawning errors

### Character Configuration
📖 **[Character Config Guide](docs/character-config.md)**
- Transaction safety protocol
- Network-specific rules
- Tool usage guidelines
- Message examples
- Style rules
- Swarm personality variants
- Prompt design for specialists

## Project Structure

```
├── src/
│   ├── index.ts                  # Entry point: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # Swarm coordinator: routing, aggregation, scheduling, regime synthesis, dynamic agent loading
│   ├── specialists/              # Research specialists (BTC-centric + altcoin-focused + meta)
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
│   │   # Meta / Self-Improvement
│   │   └── metaEngineerSpecialist.ts   # Swarm architect: reflection, gap detection, agent spawning
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
│   └── utils/                    # Shared helpers: chart generation, regime scoring logic, prompt utilities, spawn tools
├── dist/
├── build.ts
├── start-server.ts
├── vite.config.ts
├── tailwind.config.js
├── turbo.json
└── package.json
```

## Environment Setup

Copy `.env.sample` to `.env` and configure:

**Required**:
- `JWT_SECRET`
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- `VITE_CDP_PROJECT_ID`, `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`
- `ALCHEMY_API_KEY`
- For swarm: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`
- API keys for data sources (e.g., CoinGecko, DeFiLlama, etc.)

**Optional**: Plugin API keys, RPC overrides, database config (Postgres for shared state)

See: `.env.sample` for complete reference

## Key Concepts

### Plugin Actions = Tool Calls

Actions in ElizaOS work like tool calls in other LLM frameworks:
- LLM selects action and generates parameters as JSON
- Parameters flow through state (`state.data.actionParams`)
- Multi-stage validation (service, required fields, types, business logic)
- Actions chain together in multi-step execution
- Extended for swarm: Spawn tools for dynamic agents

See: [Plugin Actions Guide](docs/plugin-actions.md)

### Build Pipeline

Three-phase build:
1. **Turbo** - Workspace packages based on dependency graph
2. **Bun.build** - Backend bundle (externalizes `@elizaos/*`)
3. **Vite** - Frontend bundle

See: [Architecture Guide](docs/architecture.md)

### Character Configuration

Agent behavior defined in `src/character.ts`:
- Transaction safety rules (questions vs commands vs transfers)
- Network-specific rules (Polygon ETH = WETH, POL = gas token)
- Tool usage patterns (WEB_SEARCH for macro data, Nansen for analytics)
- Communication style (concise, evidence-based, natural tone)
- Swarm variants: BTC-centric quantitative, altcoin qualitative

See: [Character Config Guide](docs/character-config.md)

### Swarm Orchestration

- Specialists defined in `src/specialists/*.ts` with system prompts and tools
- Coordinator handles routing, aggregation, scheduling
- Dynamic agents via Postgres table and spawn tools
- MetaEngineer for self-improvement

## Common Tasks

### Add a Plugin
1. Create `src/plugins/plugin-name/` structure
2. Implement actions (see [Plugin Actions Guide](docs/plugin-actions.md))
3. Export plugin from `src/plugins/plugin-name/src/index.ts`
4. Register in `src/index.ts` plugins array
5. Rebuild: `bun run build:backend`

See: [Development Guide](docs/development.md#adding-a-new-plugin)

### Add an Action
1. Create action file in `src/plugins/plugin-name/src/actions/`
2. Export from plugin's `src/index.ts`
3. Rebuild: `bun run build:backend`

See: [Development Guide](docs/development.md#adding-an-action-to-existing-plugin)

### Add/Modify a Specialist
1. Create/edit `src/specialists/specialist-name.ts` (system prompt, tools, channel)
2. Register in `src/index.ts` loading array
3. Configure in coordinator for routing/scheduling
4. Rebuild: `bun run build:backend`

See: [Development Guide](docs/development.md#adding-specialists)

### Modify Character
1. Edit `src/character.ts`
2. Rebuild: `bun run build:backend`

See: [Character Config Guide](docs/character-config.md)

### Update Frontend
1. Edit files in `src/frontend/`
2. Rebuild: `bun run build:frontend`
3. Restart: `bun run start`

See: [Development Guide](docs/development.md#frontend-changes)

## Troubleshooting Quick Reference

**Build fails**: `rm -rf dist node_modules && bun install && bun run build`
**Server won't start**: Check `.env` has required keys, verify `dist/index.js` exists
**Agent/swarm not responding**: Check LLM API key, WebSocket/Slack connection, server logs
**Action not available**: Check `validate` returns true, plugin registered, rebuild backend
**Frontend not updating**: Rebuild frontend, restart server (no hot-reload)
**Slack issues**: Verify bot tokens, channel invites, event subscriptions
**Dynamic agent errors**: Check Postgres table, spawn tool permissions, human approval channel

See: [Troubleshooting Guide](docs/troubleshooting.md)

## Important Constraints

### Polygon Network
- NO native ETH (ETH = WETH, cannot unwrap)
- Native gas token = POL
- POL only native on Polygon, not other chains

### Gas Token Swaps
- Keep buffer for 2+ transactions
- ETH native on: Base, Ethereum, Arbitrum, Optimism
- POL native on: Polygon
- WETH is NOT a gas token anywhere

### Swarm Boundaries
- BTC Layer: Quantitative, plugin-heavy
- Altcoin Layer: Qualitative, tool-calling heavy
- Dynamic spawning: Rate-limited, human-approved for persistent agents

See: [Character Config Guide](docs/character-config.md#network-specific-rules)

## Import Path Aliases

Use clean path aliases instead of relative `../` imports. Configured in `tsconfig.json`:

| Alias | Maps To | Use For |
|-------|---------|---------|
| `@/frontend/*` | `./src/frontend/*` | All frontend code |
| `@/constants/*` | `./src/constants/*` | Backend/shared constants |
| `@/utils/*` | `./src/utils/*` | Backend utilities |
| `@/managers/*` | `./src/managers/*` | Manager classes |
| `@/plugins/*` | `./src/plugins/*` | Plugin code |
| `@/specialists/*` | `./src/specialists/*` | Specialist definitions |

**Frontend imports** should always use `@/frontend/`:
```typescript
// ✅ Correct
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/frontend/lib/utils';
import { useModal } from '@/frontend/contexts/ModalContext';

// ❌ Avoid relative paths
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, plugin/swarm loading |
| `src/character.ts` | Character definition + swarm variants |
| `src/coordinator.ts` | Swarm routing, aggregation, dynamic loading |
| `build.ts` | Backend build script |
| `start-server.ts` | Server startup |
| `vite.config.ts` | Frontend build config |
| `.env.sample` | Environment variables reference |

## Further Reading

- 📖 [Architecture Guide](docs/architecture.md) - System design & build pipeline
- 📖 [Plugin Actions Guide](docs/plugin-actions.md) - How actions work
- 📖 [Development Guide](docs/development.md) - Common development tasks
- 📖 [Troubleshooting Guide](docs/troubleshooting.md) - Debugging & fixes
- 📖 [Character Config Guide](docs/character-config.md) - Agent behavior

### SKILLS.md

name: hypersurface-weekly-newsletter description: Comprehensive skill for generating the weekly Hypersurface newsletter via Slack bot. Orchestrates onchain data research, X sentiment analysis, and essay drafting in my exact voice from 285+ Substack essays. Load this for any newsletter-related command.

#### Overview

This skill powers the OP Slack bot’s core function: Automate weekly newsletter via Slack commands (e.g., /weekly-newsletter). References previous essay, fetches fresh data, analyzes sentiment, synthesizes into essay matching past structure and voice. Ensure consistency: Narrative-driven, data-rich, humble. Focus on wheel strategy for BTC on Hypersurface.

#### Workflow Phases

Interactive dialogue for Slack.  

Guide via messages; ask questions.  

Phase 1: Gather Inputs  
Collect:  
- Last essay (paste or link).  
- Current date for freshness.  
- Overrides (e.g., specific metrics).  
Slack questions: “Paste last essay?” “Any emphases?”Respond with ‘continue’.  

Phase 2: Onchain Data Research  
Check BTC direction metrics:  
- Spot price, changes, levels.  
- Fear & Greed.  
- Deribit: OI skew, max pain.  
- Coinglass: Funding, liquidations.  
- Others: ETF flows, whales, ratios.  
Bias synthesis: Upside/downside probs.  
Output: Bullets + summary. Use web_search/browse_page for data.’Continue’.  

Phase 3: X Sentiment Analysis  
Scan:  
- Keywords: BTC options, strikes, squeezes.  
- Balance sources; exclude noise.  
Framework: Narratives, temperature.  
Extract: Quotes, themes.  
Use x_semantic_search/x_keyword_search. Output: Summary.’Continue’.  

Phase 4: Essay Drafting  
Synthesize:  
- Hook: Price drama.  
- Sentiment: X integration.  
- Recap: Last trade.  
- Scenarios: Forks with strikes.  
- Validation: Metrics tie-back.  
- Close: Philosophy, DYOR.  
~1,500 words. Match 285+ essays voice.  
Output: Draft. Ask: “Refinements?”  

Phase 5: Polish & Finalize  
Voice check.  
Fact verify.  
Slack post: Markdown essay.  

#### Voice Guidelines (From 285+ Essays)

Tone: Dramatic/grounded.  
Structure: Hook → sentiment → recap → scenarios → tables → validation → mindset.  
Phrases: “Classic fork,” “Goldilocks.”  
Banned: Jargon, overconfidence.  
Disclaimers: “Not advice,” “DYOR.”  

#### Banned Assumptions

No data guesses—fetch real-time.  
Probabilistic language.  
Neutral direction.  

#### Efficiency Notes

Progressive load.  
Stackable.  
Token lean.  

Invoke: “Use hypersurface-weekly-newsletter skill for this week’s draft.”

For tackling large features with Claude Code we leverage the “interview” style to flesh out ambiguities early, avoiding the classic trap of building the wrong thing fast. I love how it emphasizes non-obvious questions to dig into tradeoffs and edge cases, turning a vague spec into something executable.

Since we’re sharing this in the context of our ongoing discussion (building an OP Slack bot inspired by Otaku, with CLAUDE.md and SKILLS.md as anchors), I’ll adapt our prompt and method for use with me (Grok). I don’t have an exact “AskUserQuestionTool” like Claude, but I can simulate an interactive interview through my responses, using tools like code_execution to validate ideas mid-conversation or browse_page/web_search for research. We can iterate in this chat, then “execute” by generating code/PRs in a fresh thread if needed.

### Adapted Prompt for Grok (Spec-Based Building)

Here’s a refined version of your prompt, tweaked for Grok’s strengths (e.g., real-time X searches for sentiment, code_execution for prototyping, and my continuously updated knowledge). Use this to kick off large features with me:

Read this minimal spec in @SPEC.md (or the description below if no file). Interview me in detail about literally anything: technical implementation details, UI/UX tradeoffs (even for backend bots), performance concerns, security risks, scalability, integration points, edge cases, ethical considerations, etc. Make questions non-obvious and probing—aim for depth over breadth. Be very in-depth and continue interviewing continually until the spec feels complete and airtight. Use tools like code_execution to prototype small snippets or validate assumptions during the interview if helpful. Once done, output the full refined spec as a Markdown file (e.g., UPDATED_SPEC.md) with sections for overview, requirements, architecture, risks, and implementation plan.

#### Why This Adaptation Works Better

- Tool Integration: Adds explicit use of my tools (e.g., code_execution for quick tests, x_semantic_search for real-time sentiment validation in crypto contexts like your Hypersurface bot).  
- Structure: Ensures the output is a polished Markdown file, ready for CLAUDE.md integration or repo commit.  
- Depth Focus: Keeps “non-obvious” but adds “probing” to encourage questions like “How do we handle Slack rate limits during high-vol crypto events?” instead of basics.  
- Iteration Loop: Mirrors your “continue continually” but ties it to a clear endpoint (complete spec).  
- Grok-Specific Tweaks: Leverages my X ecosystem search (e.g., for sentiment in your newsletter workflow) and no knowledge cutoff, so interviews can pull live data.  

#### Example Workflow with This Method (For our OP Slack Bot)

# SPEC.md: OP Slack Bot for Hypersurface Newsletter Automation

## Overview
Build a backend-only Slack bot (no frontend) inspired by IkigaiLabsETH/otaku's modular agent architecture. The bot automates the weekly Hypersurface newsletter on Substack by handling Slack commands to fetch onchain data, analyze X sentiment, and draft essays in our specific voice derived from 285+ past essays. Use CLAUDE.md for development guidance and SKILLS.md for workflow orchestration.

## Key Requirements
- **Trigger Mechanism**: Slack slash command (e.g., /weekly-newsletter) to initiate the process.
- **Data Research**: Fetch real-time onchain metrics impacting BTC direction (Fear & Greed Index, OI distribution, funding rates, Deribit insights, Coinglass liquidations, ETF flows, whale patterns).
- **Sentiment Analysis**: Scan X for BTC options/wheel strategy sentiment, balancing KOLs/retail, extracting narratives and bias.
- **Essay Drafting**: Synthesize into ~1,500-word Markdown essay with structure: dramatic hook, sentiment summary, last trade recap, two scenarios (call exercised → puts; expires worthless → roll calls), strike analysis (Goldilocks picks), metrics validation, wheel philosophy close, DYOR disclaimers.
- **Voice Matching**: Ensure drafts match narrative-driven, data-rich, humble tone from essay history.
- **Output**: Post drafted essay back to Slack channel/thread.
- **Modularity**: Otaku-style plugins for data sources and phases; integrate SKILLS.md phases interactively.
- **Tech Constraints**: Node.js/Bun backend with Slack Bolt; no UI; secure env vars for API keys.

## Architecture Sketch
- Monorepo with Bun workspaces.
- Core: Slack event listener → plugin orchestration → Grok API calls for skills.
- Plugins: onchain-fetcher, x-sentiment, essay-drafter.
- Persistence: Minimal (e.g., in-memory or simple file for session state); no DB unless needed for history.

## Risks & Tradeoffs
- API rate limits during volatility.
- Voice drift over time.
- Security: Handle sensitive data in private Slack channels.

## Implementation Plan
- Phase 1: Setup Slack Bolt server and basic command handler.
- Phase 2: Integrate plugins for data/sentiment.
- Phase 3: Wire SKILLS.md for drafting.
- Phase 4: Test end-to-end with mock data.
- Phase 5: Deploy (e.g., Vercel or Railway).

This is a minimal starting spec. Refine via interview for non-obvious details before execution.
Let’s apply it right here to refine a minimal spec for the OP Slack bot we discussed. I’ll start with a placeholder minimal spec based on our prior chats (automating Hypersurface newsletters via Slack, no frontend, Otaku-inspired modularity). Then, I’ll “interview” you with non-obvious questions to build it out. Respond to my questions, and we’ll iterate until ready—once complete, I’ll output the full spec.

Minimal Starting Spec

Feature: OP Slack Bot for Hypersurface Newsletter

Trigger via Slack command (e.g., /weekly-newsletter).

Fetch onchain data (Fear & Greed, OI, funding rates, Deribit, Coinglass).

Analyze X sentiment for BTC options.

Draft ~1,500-word essay in our voice (from 285+ Substack essays).

Output to Slack as Markdown.

Backend-only (Node/Bun, Slack Bolt); modular plugins like Otaku.

Integrate with SKILLS.md for phases; CLAUDE.md for dev guidance.

Now, the interview begins. I’ll ask 3-5 non-obvious questions per round, focusing on depth. Answer them, add any clarifications, and we’ll refine from there.

Interview Round 1: Probing Technical Tradeoffs and Concerns

Given the reliance on external APIs like Deribit and Coinglass for real-time data, how should the bot handle cascading failures during high-vol events (e.g., if one API times out, do we fallback to cached data from X sentiment, or abort and notify the team with a partial draft)? What latency thresholds would trigger these fallbacks?

For modularity (Otaku-style plugins), we’re avoiding a frontend— but how do we ensure plugin extensibility without overcomplicating the backend? For instance, if we add a new data source like Glassnode later, what registration mechanism (e.g., dynamic import vs config file) minimizes redeploys while keeping the bot lightweight?

Voice-matching from 285+ essays is key, but embeddings or simple keyword matching might drift over time as your style evolves. What safeguards (e.g., periodic retraining via code_execution tests or human review gates) should we build in to detect and correct “voice drift” without manual intervention every week?

Security-wise, since this bot handles potentially sensitive onchain insights, how do we balance Slack’s shared workspace risks? For example, should drafts be ephemeral (deleted after 24h) or encrypted, and what audit logging (e.g., via a private channel) would capture command history without bloating storage?

On scalability: If this bot expands to multiple users/teams (e.g., shared Hypersurface ops), what concurrency model (e.g., queueing with BullMQ vs simple async handling) avoids rate limits on X searches or API calls, especially during market dumps when sentiment spikes?

Your turn—answer these, add any clarifications, and we’ll refine from there.

### Otaku Repository Architecture Overview

The Otaku repository (https://github.com/IkigaiLabsETH/otaku) is an autonomous DeFi trading and research AI agent built on the ElizaOS framework. It features a modern React frontend for user interaction, Coinbase Developer Platform (CDP) wallet integration for secure on-chain operations, and a modular plugin system for extending capabilities like swaps, bridging, analytics, and market data retrieval. The architecture emphasizes modularity, real-time communication, and persistence, making it scalable for DeFi tasks across multiple chains.

Below is a detailed breakdown of the architecture, including key components, file structure, workflow, modules, and other elements.

#### Key Components

- **Agent Core (Otaku)**: Defined in src/character.ts, this is the heart of the system—a DeFi-focused AI agent with traits like data-driven precision, conversational style, and expertise in portfolio management, risk assessment, cross-chain ops, and transaction safety. Leverages ElizaOS’s bootstrap plugin for core functions: action execution, message evaluation, state management, and memory handling.
- **Frontend**: A React 18 app with TypeScript, built using Vite for fast bundling, Tailwind CSS for styling, and Radix UI for components. Handles real-time chat, dashboards, agent management, and authentication via CDP wallet. State managed with Zustand (client-side), React Query (API caching), and React Context (global UI elements like modals).
- **Backend**: Custom build of @elizaos/server runtime, powered by Bun 1.2.21 for high performance. Supports embedded PGlite (local SQLite-like DB) or external PostgreSQL (e.g., via Neon or Railway) for data persistence. Exposes REST/WebSocket APIs for agents, messaging, sessions, and health checks.
- **Plugins**: Extensible modules that enhance the agent’s DeFi capabilities. Each plugin provides specific actions (e.g., API calls or on-chain interactions). Examples include wallet ops, market data, web search, DeFi analytics, bridging, and transaction verification (detailed in the table below).

#### File Structure

The repo uses a monorepo setup with Bun workspaces for efficient management. Here’s the high-level tree:

```
├── src/
│   ├── index.ts              # Agent and plugin setup entry point
│   ├── character.ts          # Otaku agent personality and prompts
│   ├── frontend/             # React frontend app
│   │   ├── App.tsx           # Main app with CDP wallet integration
│   │   ├── components/       # UI elements (e.g., chat, dashboard, auth)
│   │   ├── lib/              # Utilities (e.g., elizaClient, socketManager)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # Contexts for modals and loading
│   │   └── types/            # TypeScript definitions
│   ├── packages/             # Monorepo packages
│   │   ├── api-client/       # Type-safe API client for ElizaOS server
│   │   └── server/           # Custom ElizaOS backend runtime
│   └── plugins/              # DeFi plugins (e.g., cdp, coingecko)
├── dist/                     # Build artifacts (backend + frontend)
├── build.ts                  # Script for building backend
├── start-server.ts           # Server startup script
├── vite.config.ts            # Vite bundler config for frontend
├── tailwind.config.js        # Tailwind CSS theme
├── turbo.json                # Turbo monorepo build config
├── package.json              # Root deps and scripts
├── .env.sample               # Env var template (e.g., API keys)
└── docs/                     # Additional docs (e.g., x402-payments.md)
```

This structure separates concerns: src/ for core logic, packages/ for reusable modules, and build tools for deployment.

#### System Workflow

Otaku operates as an agentic system where user inputs trigger AI-driven DeFi actions. Here’s the high-level flow:

- **Initialization**: index.ts configures the Otaku agent, registers plugins, and sets up the server. Server launches via start-server.ts, serving APIs and the bundled frontend.
- **User Interaction**: Users authenticate with CDP wallet in the frontend (handled in components/auth/). Real-time WebSocket connection established using socketManager in lib/. Messages/commands sent via elizaClient.messaging.postMessage().
- **Agent Processing**: Incoming messages are evaluated by the Otaku agent (using ElizaOS logic). Based on intent, relevant plugins are invoked (e.g., a swap query triggers plugin-cdp). Data is fetched from external sources (e.g., CoinGecko for prices, DeFiLlama for TVL).
- **Action Execution**: On-chain actions (e.g., swaps, bridges) are signed via CDP and executed. Transactions are verified with plugin-etherscan. State (messages, memories) is persisted using @elizaos/plugin-sql.
- **Real-Time Updates**: Socket.IO pushes live updates: message responses, tx statuses, market data. React Query handles caching for efficient UI refreshes.

This workflow enables autonomous, multi-step reasoning and execution, with persistence for long-running sessions.

#### Main Modules

- src/character.ts: Defines the agent’s bio, system prompt, and behavioral traits.
- src/index.ts: Bootstraps the agent, plugins, and server.
- src/frontend/: Full React app for UI-driven interactions.
- src/plugins/: Directory of extensible plugins (see table below).
- @elizaos/api-client: Type-safe client for backend communication.
- @elizaos/server: Custom server runtime for API and WebSocket handling.

#### Plugins Table

Plugins are the modular extensions that make Otaku DeFi-capable.

| Plugin Name       | Description                          | Key Actions/Features |
|-------------------|--------------------------------------|----------------------|
| plugin-cdp        | CDP wallet for on-chain ops         | Wallet creation, token/NFT transfers, swaps, multi-chain support |
| plugin-coingecko  | Real-time prices & trending         | Market data fetch    |
| plugin-defillama  | TVL & protocol analytics            | DeFi metrics         |
| plugin-relay      | Cross-chain bridging                | Bridge operations    |
| plugin-etherscan  | On-chain verification               | Tx checks            |
| plugin-web-search | Tavily + CoinDesk news              | Search & news        |
| plugin-bootstrap  | Core ElizaOS (actions, state)       | Base agent functions |

#### Agent Core (ElizaOS Integration)

Built atop ElizaOS, which provides the foundational agent framework for multi-step planning, reasoning, and plugin orchestration.  
Supports memory/knowledge providers for context retention across sessions.  
Integrates SQL for persistent storage, enabling long-term agent “memory.”

#### Frontend Architecture

- Components: Feature-based organization (e.g., chat UI, dashboard visuals).
- State Management: Zustand for local state, React Query for server-sync’d data.
- Communication: Socket.IO for bidirectional real-time updates.
- Wallet Handling: CDP-specific hooks for user wallet state and tx signing.
- Styling: Tailwind with custom themes; responsive design via Radix primitives.

#### Build & Deployment

- Build System: Turbo monorepo for incremental, parallel builds across workspaces.
- Scripts:  
  - bun run dev: Starts dev server (builds + runs on port 3000).  
  - bun run build: Produces production artifacts in dist/.  
  - bun run build:all: Builds all packages.
- Deployment: Designed for platforms like Railway (with Postgres for pgvector embeddings). Run bun run build then SERVER_PORT=$PORT bun run start. Env vars set via platform UI.

#### Environment & Configuration

- .env.sample: Template for required vars like JWT_SECRET, OPENAI_API_KEY, CDP creds, ALCHEMY_API_KEY, POSTGRES_URL.
- Local DB: Embedded PGlite at ./.eliza/.elizadb.
- Production DB: External PostgreSQL with pgvector for vector embeddings (e.g., search/memory).

#### Diagrams and Visuals

No explicit architectural diagrams (e.g., flowcharts or UML) are present in the repo’s README or main descriptions. The structure is explained textually, focusing on code organization and workflows.

This architecture draws from Otaku’s goal of autonomy in DeFi: modular plugins for extensibility, ElizaOS for agent intelligence, and a lightweight frontend (though our adaptation skips the UI for a pure Slack bot). For deeper dives, explore specific files like character.ts or plugin sources directly on GitHub.

## License

MIT

## Acknowledgements

- Original Otaku by Shaw Walters and ElizaOS contributors.
- Extended for Ikigai Studio BTC regime and altcoin research.
- ElizaOS: [https://github.com/elizaos/eliza](https://github.com/elizaos/eliza)
- Slack client: `@elizaos/plugins/client-slack`
- Managed hosting: Eliza Cloud

© 2026 Ikigai Studio. All original Otaku features retained and extended. Small edges compound.
