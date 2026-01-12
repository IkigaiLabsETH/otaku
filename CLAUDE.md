# CLAUDE.md

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
