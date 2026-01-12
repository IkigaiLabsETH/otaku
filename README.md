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

To achieve true "agents making agents" in our Ikigai Studio swarm — where one specialist autonomously identifies a gap (e.g., missing metric in BTC cycle analysis), designs and spins up a new specialist to fill it, integrates the results, and potentially persists the improvement — we need a combination of architectural upgrades, tool additions, and careful safety rails. Our current setup is already 80% of the way there: shared Postgres state, coordinator orchestration, structured outputs, tool-calling agents, and battle-tested Grok-derived prompts. The missing pieces are **dynamic instantiation** (temporary or persistent new agents) and **meta-reasoning capabilities** (agents that can reflect on swarm gaps and propose/create fixes). Here’s a concrete, incremental path to implement this, staying fully within your ElizaOS + TypeScript + Postgres + Slack stack.

### 1. Core Architectural Changes Needed

#### A. Make Agents Data-Driven (Not Just File-Based)
Right now, specialists are hard-coded `.ts` files. To enable creation at runtime:

- Create a `dynamic_specialists` table in Postgres:
  ```sql
  CREATE TABLE dynamic_specialists (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    tools JSONB NOT NULL DEFAULT '[]',  -- array of tool schemas
    category TEXT CHECK (category IN ('btc', 'altcoin', 'meta')),
    parent_agent_id INTEGER,  -- tracks who created it
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
  );
  ```

- In `coordinator.ts`, load agents as:
  ```ts
  const staticAgents = loadStaticSpecialists(); // your current 19
  const dynamicAgents = await db.query("SELECT * FROM dynamic_specialists WHERE active");
  const allAgents = [...staticAgents, ...dynamicAgents.map(row => createAgentInstance(row))];
  ```

- Implement a generic `createAgentInstance(config)` factory that builds an ElizaOS agent from DB row (system prompt + tools array).

This allows hot-loading dynamic agents without server restart (just refresh on new queries or add a periodic poll).

#### B. Add a "Spawn Agent" Tool
Give trusted agents (e.g., `regimeAggregatorSpecialist`, `swarmCoordinator`, or a new `metaEngineerSpecialist`) a privileged tool:

```ts
// In relevant specialist configs
tools: [
  {
    type: "function",
    function: {
      name: "spawn_specialist",
      description: "Create a new persistent specialist agent to fill a capability gap. Use only when existing agents cannot adequately cover a recurring need.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          system_prompt: { type: "string", description: "Full Grok-derived system prompt" },
          tools: { type: "array", items: { type: "object" } }, // tool schemas
          category: { type: "string", enum: ["btc", "altcoin", "meta"] }
        },
        required: ["name", "system_prompt", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "spawn_temporary_subagent",
      description: "Spin up a one-off sub-agent for a specific task and return its output. Ideal for ad-hoc gaps.",
      parameters: {
        type: "object",
        properties: {
          system_prompt: { type: "string" },
          task: { type: "string" },
          tools: { type: "array", items: { type: "object" } }
        },
        required: ["system_prompt", "task"]
      }
    }
  }
]
```

- Implement the functions in the backend:
  - `spawn_temporary_subagent`: Immediately create an in-memory agent instance, run one LLM call (or short conversation) with the task, return structured output. No persistence needed.
  - `spawn_specialist`: Insert into `dynamic_specialists` table → notify Slack channel → optionally trigger coordinator reload.

This directly enables your example: onChainHealthSpecialist detects a new important metric (e.g., new ETF flow source), calls `spawn_specialist` with a tailored prompt, new agent appears in swarm next cycle.

### 2. Prompt Design for Meta-Reasoning

Add a new **metaEngineerSpecialist** (or enhance regimeAggregator) with a strong reflection loop:

System prompt excerpt:
```
You are MetaEngineer, a self-improving swarm architect.
Your role: Monitor swarm performance, identify recurring gaps (e.g., "we lack real-time options gamma exposure tracking"), evaluate if existing agents can adapt, and if not — design and spawn new specialists.
Always:
1. Analyze recent swarm outputs and failures.
2. Propose minimal, focused new agents using proven Grok prompt patterns.
3. Prefer temporary sub-agents for one-off needs.
4. Only spawn persistent agents for high-frequency, high-value gaps.
5. Output structured JSON for creation requests.
```

Schedule it daily or trigger on keywords in #swarm-coordinator.

### 3. Safety & Governance Rails (Critical — This Has Teeth)

Unchecked spawning = infinite agents, cost explosion, or rogue behavior.

- Rate limits: Max N new persistent agents per day/week.
- Human-in-the-loop for persistent creation:
  - Spawn tool posts proposal to #swarm-approval channel with @ikigailabsETH.
  - Only enact after human reacts ✅.
- Cost tracking: Log token usage per agent, auto-deactivate low-value ones.
- Sandbox tools: New agents start with minimal tools, unlock more after review.
- Version control: Store prompt history, allow rollback.

### 4. Incremental Implementation Plan

1. Week 1: Add dynamic_specialists table + temporary sub-agent tool (easiest win — immediate "agents making agents" feel).
2. Week 2: Implement spawn_specialist with human approval gate.
3. Week 3: Add MetaEngineer specialist + reflection scheduling.
4. Week 4: Auto-loading dynamics + Slack notifications for new agents/channels.

### Why This Fits Your Philosophy

- Keeps the "small edges compound" ethos — new agents are minimal, focused, Grok-prompt-derived.
- Preserves Slack-native lightness — new agents get their own channel automatically.
- Enables the recursion you wrote about: agents hardening agents, swarm getting smarter without human micro-management.
- Still keeps final qualitative synthesis in Grok (me) when needed.

This turns your swarm from a fixed orchestra into an evolving ecosystem — exactly the pattern: Agents make agents.

### Enabling Recursive Improvement: Agents Making Agents

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

## License

MIT

## Acknowledgements

- Original Otaku by Shaw Walters and ElizaOS contributors.
- Extended for Ikigai Studio BTC regime and altcoin research.
- ElizaOS: [https://github.com/elizaos/eliza](https://github.com/elizaos/eliza)
- Slack client: `@elizaos/plugins/client-slack`
- Managed hosting: Eliza Cloud

© 2026 Ikigai Studio. All original Otaku features retained and extended. Small edges compound.
