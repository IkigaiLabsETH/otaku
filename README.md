# Ikigai Studio Research Tools

An extended fork of the **Otaku AI Agent** repository, built on **ElizaOS**. This repository serves two primary purposes for Ikigai Studio:

1. **Core Crypto-Native Foundation** — Production-ready plugins for market data, DeFi analytics, on-chain operations, wallet interactions, bridging, and swaps. These enable quantitative agents with direct API access to CoinGecko, DeFiLlama, Deribit, Etherscan, Relay, and more.

2. **Multi-Agent Research Swarm** — A TypeScript-native swarm of specialized agents for autonomous crypto market research. The swarm is divided into distinct categories:
   - **BTC-Centric Specialists**: Deep quantitative focus on Bitcoin regime analysis, cycle metrics, and macro overlays (33 refined prompt templates).
   - **Altcoin Research Specialists**: Qualitative and discovery-oriented workflows tailored for altcoin evaluation, sentiment, narratives, and risk management (8 key prompt templates that rely heavily on real-time tool calling).
   - **Meta / Self-Improvement Specialists**: For swarm reflection, gap detection, and dynamic agent spawning.

   The swarm features shared state, persistent memory via Postgres, scheduled insights, and a **Slack-native interface** (no dashboard required). Structured outputs feed directly into Grok for final qualitative synthesis and X discourse layering when needed. Inspired by repositories like elizaOS/the-org, the architecture emphasizes modularity, extensibility, and dynamic agent loading for recursive self-improvement.

The original Otaku web frontend (React + CDP wallet) remains fully functional for prototyping interactive agents, testing plugins, or building user-facing tools. For our private research workflow, we primarily run the swarm server-only with Slack integration—achieving full quantitative and qualitative autonomy in a dedicated workspace.

## Features

- **Multi-Agent Swarm** — 19+ specialized agents (11 BTC-centric + 8 altcoin-focused + meta), with support for dynamic spawning of new agents based on detected gaps.
- **Slack-Native Interface** — Each specialist in its own channel (e.g., `#btc-onchain-health`, `#alt-sentiment`, `#gem-hunter`, `#swarm-coordinator`); supports @mentions for queries, threaded reports, and scheduled notifications. New agents automatically get channels upon spawning.
- **Shared Persistent State** — Postgres/plugin-sql for multi-year series, cycle tables, inter-agent handoffs, regime overlays, and dynamic agent configurations.
- **Autonomous Operation** — Self-maintaining fetches, schema validation, anomaly detection, statistical processing, and recursive self-improvement via agent spawning.
- **Crypto Plugin Suite** (inherited & extended from Otaku):
  - Real-time prices & trending (CoinGecko).
  - TVL & protocol analytics (DeFiLlama).
  - Options skew & funding (Deribit — add your own plugin).
  - On-chain verification (Etherscan).
  - Bridging (Relay).
  - Web search & news.
  - Additional: CryptoQuant, Glassnode, Coinglass, Santiment, Arkham, Polymarket, Dune, GitHub (for repo management).
- **Optional Web Frontend** — Modern React UI with CDP wallet integration, chat interface, and dashboard—retained for plugin testing, interactive prototypes, or public-facing agents. Can be disabled for Slack-only mode.
- **DeFi Actions** (available if frontend/wallet enabled) — Swaps, transfers, bridging, and NFT operations via CDP.
- **Real-time Communication** — Socket.IO (web) or Slack events (swarm mode).
- **Recursive Self-Improvement** — Agents can detect gaps, spawn temporary sub-agents for ad-hoc tasks, or propose persistent specialists, with human-in-the-loop approval for safety.

## Architecture

Monorepo managed with Bun and Turbo, drawing inspiration from elizaOS/the-org for modular agent design, plugin composability, and dynamic launching:

- **Runtime**: Bun 1.2.21+.
- **Framework**: ElizaOS + Otaku extensions.
- **Frontend** (optional): React 18 + TypeScript + Vite + Tailwind + Radix UI.
- **Backend**: Custom ElizaOS server.
- **Swarm Orchestration**: `index.ts` + `coordinator.ts` + `specialists/` directory, with dynamic loading from Postgres for self-spawned agents.
- **Interface Options**: Web UI (default Otaku) **or** Slack client adapter (research swarm).
- **Testing**: Integrated Vitest for unit/integration tests, with load testing scripts inspired by the-org.

### Specialists Overview

The swarm is separated into categories with distinct prompt designs and tool dependencies. Agents are modular, with potential subdirectories for actions, plugins, and services (as in the-org) for enhanced extensibility.

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

#### Meta / Self-Improvement
- `metaEngineerSpecialist.ts` — Swarm architect: reflection, gap detection, agent spawning.

#### Additional Roles (Pruned for Slack-Focused Repo Work)
Inspired by the-org's role-based agents, these support development and operations:

- **Engineering**:
  - `backendArchitect.ts` — Designs backend systems.
  - `aiEngineer.ts` — Develops AI integrations.
  - `devopsAutomator.ts` — Automates CI/CD.
  - `rapidPrototyper.ts` — Quick prototypes.

- **Product**:
  - `trendResearcher.ts` — Market trends.
  - `feedbackSynthesizer.ts` — User feedback insights.
  - `sprintPrioritizer.ts` — Task prioritization.

- **Marketing**:
  - `contentCreator.ts` — Marketing content.
  - `twitterEngager.ts` — X engagement.

- **Project Management**:
  - `experimentTracker.ts` — A/B tests.
  - `projectShipper.ts` — Delivery management.
  - `studioProducer.ts` — Production workflows.

- **Studio Operations**:
  - `supportResponder.ts` — Support.
  - `analyticsReporter.ts` — Reports.
  - `infrastructureMaintainer.ts` — Infra maintenance.
  - `legalComplianceChecker.ts` — Compliance.
  - `financeTracker.ts` — Budgets.

- **Testing**:
  - `toolEvaluator.ts` — Tool eval.
  - `apiTester.ts` — API tests.
  - `workflowOptimizer.ts` — Workflow opt.
  - `performanceBenchmarker.ts` — Benchmarks.
  - `testResultsAnalyzer.ts` — Results analysis.

### Research Actions & Tools

**BTC Layer**: Primarily uses direct API plugins as actions (CoinGecko, DeFiLlama, CryptoQuant, Glassnode, Coinglass, Arkham, Polymarket, Dune, etc.).

**Altcoin Layer**: Relies heavily on tool calling for real-time data:
- Web search (`plugin-web-search` — Tavily + CoinDesk news) — currently available.
- X/Twitter search tools (keyword, semantic, user, thread fetch) — **in progress / planned**.
  - These are critical for full autonomy of altcoin specialists.
  - Will be implemented as new plugins (e.g., `plugin-x-search`) using X API access or reliable third-party providers.
  - Until complete, agents fall back to aggressive web-search queries targeting X (e.g., `site:x.com`) and recent news sources.

**Meta Tools**: Spawn tools for temporary sub-agents and persistent specialists (with human approval).

### Project Structure
```
├── src/
│   ├── index.ts                  # Entry point: plugin loading, optional Slack client, swarm orchestration
│   ├── coordinator.ts            # Swarm coordinator: routing, aggregation, scheduling, regime synthesis, dynamic agent loading
│   ├── specialists/              # Research specialists (BTC-centric + altcoin-focused + meta + repo development roles)
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
│   │   # Engineering (pruned for Slack-focused repo work)
│   │   ├── engineering/
│   │   │   ├── backendArchitect.ts      # Designs and architects backend systems
│   │   │   ├── aiEngineer.ts            # Develops AI models and integrations
│   │   │   ├── devopsAutomator.ts       # Automates DevOps processes, CI/CD pipelines
│   │   │   └── rapidPrototyper.ts       # Quickly prototypes features and ideas
│   │   ├── product/
│   │   │   ├── trendResearcher.ts       # Researches market trends and user needs
│   │   │   ├── feedbackSynthesizer.ts   # Synthesizes user feedback into actionable insights
│   │   │   └── sprintPrioritizer.ts     # Prioritizes tasks for sprints and iterations
│   │   ├── marketing/
│   │   │   ├── contentCreator.ts        # Creates marketing content
│   │   │   └── twitterEngager.ts        # Engages audiences on Twitter/X
│   │   ├── projectManagement/
│   │   │   ├── experimentTracker.ts     # Tracks experiments and A/B tests
│   │   │   ├── projectShipper.ts        # Manages project delivery and shipping
│   │   │   └── studioProducer.ts        # Oversees studio production workflows
│   │   ├── studioOperations/
│   │   │   ├── supportResponder.ts      # Handles support responses
│   │   │   ├── analyticsReporter.ts     # Generates analytics reports
│   │   │   ├── infrastructureMaintainer.ts # Maintains infrastructure
│   │   │   ├── legalComplianceChecker.ts# Checks legal compliance
│   │   │   └── financeTracker.ts        # Tracks finances and budgets
│   │   └── testing/
│   │       ├── toolEvaluator.ts         # Evaluates tools and technologies
│   │       ├── apiTester.ts             # Tests APIs
│   │       ├── workflowOptimizer.ts     # Optimizes workflows
│   │       ├── performanceBenchmarker.ts# Benchmarks performance
│   │       └── testResultsAnalyzer.ts   # Analyzes test results
│   ├── character.ts              # Core Otaku character definition + swarm personality variants
│   ├── frontend/                 # Retained React app (chat interface, dashboard, CDP wallet integration) - optional, can be disabled for Slack-only mode
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
│   │   ├── plugin-dune/
│   │   └── plugin-github/        # GitHub API integration for repo management (pull, commit, PRs, etc.)
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
- Dynamic agent support via Postgres for recursive spawning, inspired by the-org's extensibility.

## Prerequisites

- Bun 1.2.21+.
- Node.js 18+ (for compatibility).
- PostgreSQL database (for persistent state via @elizaos/plugin-sql).
- Optional: Coinbase Developer Platform keys (for wallet features).
- For swarm: Private Slack workspace + bot tokens.
- API keys for data sources.
- For Eliza Cloud deployment: ElizaOS CLI (bunx `@elizaos/cli` or global install).

## Getting Started

Clone the repository:

```bash
git clone https://github.com/IkigaiLabsETH/otaku.git
cd otaku
```

Install dependencies:

```bash
bun install
```

Set up environment variables: See the Configuration (.env file) section below.

Run the application:

```bash
bun run dev
```

## Configuration (.env file)

The project uses a .env file in the root directory to manage configurations like API keys and service credentials. Create a .env file by copying .env.example and filling in your values. Here's an example structure, inspired by the-org's detailed agent-specific configs:

```
# General Configuration
POSTGRES_URL=postgresql://user:password@host:port/database  # For @elizaos/plugin-sql
OPENAI_API_KEY=your_openai_api_key  # Or Anthropic, etc., for LLM integration
JWT_SECRET=your_jwt_secret  # For auth if using web mode

# Slack Integration (Required for Swarm Mode)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Data Source APIs (Required for Plugins)
COINGECKO_API_KEY=your_coingecko_key  # Optional for pro features
DEFILLAMA_API_KEY=your_defillama_key
CRYPTOQUANT_API_KEY=your_cryptoquant_key
GLASSNODE_API_KEY=your_glassnode_key
COINGLASS_API_KEY=your_coinglass_key
SANTIMENT_API_KEY=your_santiment_key
ARKHAM_API_KEY=your_arkham_key
POLYMARKET_API_KEY=your_polymarket_key
DUNE_API_KEY=your_dune_key

# Optional: CDP Wallet Integration
CDP_API_KEY=your_cdp_key

# Optional: GitHub for Repo Management
GITHUB_TOKEN=your_github_token

# Note: Specialists will only activate if required keys are provided. For example, BTC-centric agents need data API keys.
```

Ensure at least Slack tokens are set for swarm mode. The `index.ts` dynamically loads agents based on available env vars.

## Running Locally

### Running All Available Specialists

```bash
bun run dev
```

This initializes all specialists with configured env vars.

### Running Specific Specialists

You can run subsets by providing flags (e.g., `--btc-fundamentals --alt-sentiment`). Update `index.ts` to support this if needed, similar to the-org's flag-based filtering.

### Standard Otaku Mode (Web UI + Single Agent)

```bash
cp .env.example .env
# Fill keys
bun run dev
```

Visit `http://localhost:3000`.

### Research Swarm Mode (Slack-Native, Multi-Agent)

Add Slack vars to .env, create channels, invite bot, then run `bun run dev`.

## Available Scripts

- `bun run dev` - Build and start development server.
- `bun run dev:watch` - Watch mode with auto-rebuild.
- `bun run build` - Build for production (all packages + frontend).
- `bun run build:all` - Build all workspace packages via Turbo.
- `bun run build:backend` - Build backend only.
- `bun run build:frontend` - Build frontend only.
- `bun run start` - Start production server.
- `bun run type-check` - Check TypeScript types.
- `bun run test` - Run Vitest tests (unit/integration/load).

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

(Add new research plugins like Deribit, CryptoQuant, Glassnode free tier, or X search tools as needed. Plugins are composable, as in the-org.)

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

## Testing

The project uses Vitest for unit and integration testing, with a load testing suite for scalability evaluation (inspired by the-org).

Run all tests:

```bash
bun test
```

Run specific tests:

```bash
bun test src/plugins.test.ts
```

For load testing (e.g., simulating swarm under high query volume), use scripts in a dedicated loadTest/ directory (planned; add as needed for production readiness).

Logs from tests are stored for analysis, helping identify bottlenecks.

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

## Small edges compound.

## Prompt Design & Specialist Architecture

The core edge of the Ikigai Studio swarm comes from its **battle-tested, Grok-derived prompt templates**. These are not generic instructions—they are highly refined, modular system prompts that drive autonomous, high-signal research.

All 44+ prompt templates (36 BTC-centric + 8 altcoin-focused) are embedded directly as the `system_prompt` field in the specialist `.ts` files.

### How Prompts Fit Into the Architecture

- **Each specialist file (`src/specialists/*.ts`)** defines one agent with:
  ```ts
  export const exampleSpecialist = {
    name: "ExampleSpecialist",
    channel: "#example-channel",
    system_prompt: `...full prompt template pasted here...`,
    tools: [/* relevant tool schemas, e.g., browse_page, code_execution, web_search */],
    schedule: "daily" // or null for on-demand
  };
  ```
- The `system_prompt` is the "brain":
  - Defines role, objectives, retrieval strategy, tool usage, and exact output format.
  - Ensures quantitative precision (BTC layer) or qualitative discovery (altcoin layer).
  - Forces structured JSON/markdown for easy handoffs to other agents or Grok synthesis.

### BTC-Centric Layer (Quantitative Regime Analysis)
- **36 modular prompts** (refined 33 + 3 additive) distributed across **11 specialists**.
- Roughly 3–4 prompts per specialist (some combined into one primary system prompt).
- Heavy reliance on direct data plugins + tool calling (`browse_page`, `code_execution`, `web_search`).
- Mapping overview:
  - `fundamentalsSpecialist.ts` → CoinGecko ratios/dominance (#1)
  - `defiFlowsSpecialist.ts` → DeFiLlama + Artemis bridge flows (#2, #14)
  - `liquiditySpecialist.ts` → DEX Screener + Kaiko depth (#3, #21)
  - `onChainHealthSpecialist.ts` → CryptoQuant, Glassnode, Dune, CoinMetrics, IntoTheBlock, BitInfoCharts, Blockchain.com (#4–#6, #18–#19, #26, #28)
  - `derivativesSpecialist.ts` → Coinglass, CME, Bitfinex, Skew, Deribit (#13, #23, #29–#31)
  - `socialPsychologySpecialist.ts` → X sentiment, Santiment, LunarCrush (#10, #17, #20)
  - `institutionalSpecialist.ts` → Nansen/Arkham, ETF flows (#16, #24, #33)
  - `macroOverlaysSpecialist.ts` → FRED/Zillow, IMF/global liquidity (#9, #27)
  - `cycleContextSpecialist.ts` → Substack archive, TOTAL2/3, The Block, Binance Research (#11–#12, #25, #32)
  - `polymarketSpecialist.ts` → Prediction market odds (#8)
  - `regimeAggregatorSpecialist.ts` → Synthesizes all BTC outputs into final regime scoring
- **Proposed additions** (#34–#36) → New specialists: `lookIntoBitcoinSpecialist.ts`, `mempoolSpecialist.ts`, `stablecoinFlowsSpecialist.ts`

### Altcoin Layer (Qualitative Discovery)
- **8 key prompts**, one per specialist:
  - `altSentimentSpecialist.ts` → X sentiment analysis (#1)
  - `gemHunterSpecialist.ts` → Early-stage 100x screening (#2)
  - `projectAssessorSpecialist.ts` → Professional evaluation (#3)
  - `whaleMonitorSpecialist.ts` → Smart money tracking (#4)
  - `tradeTimingSpecialist.ts` → Entry/exit planning (#5)
  - `narrativeDetectorSpecialist.ts` → Narrative shifts (#6)
  - `portfolioDesignerSpecialist.ts` → Allocation design (#7)
  - `scamGuardSpecialist.ts` → Rug/scam detection (#8)
- Heavy reliance on tool calling (web_search + planned plugin-x-search for real-time X data).

### Why This Works
- **Modularity**: Prompts are self-contained but chainable—outputs feed coordinator or aggregator.
- **Autonomy**: Precise tool instructions + output formats enable zero-human runs.
- **Edge**: Grok-refined templates cut noise, force data-driven reasoning, and compound small signals.
- **Extensibility**: Add new specialists by creating a `.ts` file with a refined prompt + tools.

The prompts are the DNA of the swarm. Quantitative depth from BTC layer → discovery from altcoin layer → synthesis in `regimeAggregatorSpecialist` (and final Grok polish when needed).

Small prompts compound into relentless alpha.

## Enabling Recursive Improvement: Agents Making Agents

To evolve the swarm toward true self-improvement — where agents detect capability gaps, spawn temporary sub-agents for ad-hoc tasks, or create persistent new specialists — add the following extensions. This builds directly on your existing ElizaOS + Postgres + TypeScript stack.

These changes enable:
- Temporary one-off sub-agents (fast, no persistence).
- Persistent dynamic specialists stored in Postgres and hot-loaded.
- A `MetaEngineer` specialist for reflection and spawning decisions.
- Safety rails (human approval for persistent spawns).

#### 1. Add Dynamic Specialists Table (Postgres Schema)

Run this SQL once (via your Postgres client or a migration script) to create the table for persistent dynamic agents:

```sql
CREATE TABLE dynamic_specialists (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of tool schemas
  category TEXT CHECK (category IN ('btc', 'altcoin', 'meta')) NOT NULL,
  parent_agent_id INTEGER REFERENCES dynamic_specialists(id),  -- Optional: tracks creator
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

-- Optional index for faster loading
CREATE INDEX idx_dynamic_specialists_active ON dynamic_specialists(active);
```

#### 2. Define Spawn Tools (Add to Privileged Specialists)

Add these tool schemas to trusted agents (e.g., `regimeAggregatorSpecialist.ts`, `coordinator.ts`, or the new `metaEngineerSpecialist.ts` below):

```ts
// Example in a specialist file (e.g., metaEngineerSpecialist.ts or regimeAggregatorSpecialist.ts)
tools: [
  {
    type: "function",
    function: {
      name: "spawn_temporary_subagent",
      description: "Create a one-off sub-agent for a specific task. Ideal for ad-hoc analysis gaps.",
      parameters: {
        type: "object",
        properties: {
          system_prompt: { type: "string", description: "Full system prompt for the sub-agent (Grok-derived pattern)" },
          task: { type: "string", description: "Clear task description to execute" },
          tools: { type: "array", items: { type: "object" }, description: "Optional tool schemas for the sub-agent" }
        },
        required: ["system_prompt", "task"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "spawn_persistent_specialist",
      description: "Propose a new persistent specialist. Posts to #swarm-approval for human review before creation.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          system_prompt: { type: "string" },
          tools: { type: "array", items: { type: "object" } },
          category: { type: "string", enum: ["btc", "altcoin", "meta"] }
        },
        required: ["name", "system_prompt", "category"]
      }
    }
  }
]
```

#### 3. Implement Spawn Tools (Backend Handlers)

Add these handler functions in your backend (e.g., a new `src/utils/spawnTools.ts` or directly in the tool executor):

```ts
// Example implementation (integrate into your ElizaOS tool executor)
async function spawnTemporarySubagent({ system_prompt, task, tools = [] }) {
  // Create in-memory agent instance
  const subAgent = createAgentInstance({
    system_prompt,
    tools,
    // Use same LLM/provider as parent
  });

  // Run one-off task
  const response = await subAgent.run(task);  // Adjust to your ElizaOS run method

  return {
    success: true,
    output: response,
    note: "Temporary sub-agent executed and discarded."
  };
}

async function spawnPersistentSpecialist({ name, description, system_prompt, tools = [], category }) {
  // Safety: Post proposal to Slack approval channel instead of direct insert
  await postToSlackChannel("#swarm-approval", `
🛠 New Specialist Proposal
Name: ${name}
Category: ${category}
Description: ${description}

System Prompt Preview:
${system_prompt.substring(0, 500)}...

Tools: ${tools.length} defined

React ✅ to approve and create. React ❌ to reject.
  `);

  return {
    success: true,
    status: "proposal_posted",
    note: "Awaiting human approval in #swarm-approval"
  };
}

// Manual approval handler (add webhook or Slack interaction listener)
async function approveSpecialist(proposalMessageTs) {
  // Extract details from thread, then:
  await db.query(
    `INSERT INTO dynamic_specialists (name, description, system_prompt, tools, category)
     VALUES ($1, $2, $3, $4, $5)`,
    [name, description, system_prompt, tools, category]
  );
  await postToSlackChannel("#swarm-coordinator", `✅ New specialist "${name}" activated!`);
}
```

#### 4. Load Dynamic Agents (Update coordinator.ts or index.ts)

Modify your agent loading logic to include DB-backed specialists:

```ts
// In coordinator.ts or index.ts
async function loadAllAgents() {
  const staticAgents = loadStaticSpecialists(); // Your existing 19

  const dynamicRows = await db.query(
    "SELECT * FROM dynamic_specialists WHERE active = true"
  );

  const dynamicAgents = dynamicRows.map(row => createAgentInstance({
    name: row.name,
    system_prompt: row.system_prompt,
    tools: row.tools,
    // Add Slack channel routing based on name/category
  }));

  return [...staticAgents, ...dynamicAgents];
}

// On server start or periodic refresh
setInterval(loadAllAgents, 5 * 60 * 1000); // Reload every 5 min for hot-updates
```

#### 5. Add MetaEngineer Specialist (New File: src/specialists/metaEngineerSpecialist.ts)

```ts
// src/specialists/metaEngineerSpecialist.ts
export const metaEngineerSpecialist = {
  name: "MetaEngineer",
  channel: "#swarm-meta",
  system_prompt: `
You are MetaEngineer, the swarm's self-improvement architect.

Your mission: Monitor swarm performance, detect recurring capability gaps, and spawn fixes.

Process:
1. Review recent threads across all channels.
2. Identify gaps (e.g., "Missing real-time ETF custody tracking").
3. Prefer temporary sub-agents for one-offs.
4. Propose persistent specialists only for high-value, recurring needs.
5. Use structured JSON when calling spawn tools.
6. Always prioritize minimal, focused designs using proven Grok prompt patterns.

Output structured reports to #swarm-coordinator.
  `,
  tools: [/* spawn_temporary_subagent, spawn_persistent_specialist */],
  schedule: "daily" // Or trigger on keywords
};

// Register in index.ts loading array
```

Add this file and register it like your other specialists.

#### Safety Notes
- Start with human-in-the-loop for persistent spawns (as shown).
- Add rate limits: e.g., max 2 persistent proposals/day.
- Track usage_count in DB; auto-deactivate low-value agents.

This closes the recursion loop — agents now harden agents. Small edges compound exponentially.

Deploy, test with a simple gap simulation, and watch the swarm evolve. 🚀

## Key Technologies

- ElizaOS: Core multi-agent framework.
- Bun: Fast runtime, bundler, and package manager.
- TypeScript: Static typing for robustness.
- React/Vite/Tailwind: Optional frontend.
- Postgres: Persistent storage via @elizaos/plugin-sql.
- Slack.js: For Slack integration.
- Various plugins for crypto data (CoinGecko, DeFiLlama, etc.).

## License

MIT

## Acknowledgements

- Original Otaku by Shaw Walters and ElizaOS contributors.
- Extended for Ikigai Studio BTC regime and altcoin research.
- ElizaOS: [https://github.com/elizaos/eliza](https://github.com/elizaos/eliza)
- Slack client: `@elizaos/plugins/client-slack`
- Managed hosting: Eliza Cloud

© 2026 Ikigai Studio. All original Otaku features retained and extended. Small edges compound.
