# Why ElizaOS?

In a world where tools like Claude Code are gaining traction for code generation and agentic tasks, you might wonder: Why still lean into ElizaOS as our foundational framework? The answer lies in the fundamental differences between monologuing agents (like Claude Code) and truly conversational, multi-user systems like Eliza—and how those differences perfectly align with Ikigai Studio's North Star: building an evolving, autonomous Swarm-Signal Vault that turns off-chain AI insights into on-chain DeFi yields.

Claude Code excels as a monologuing agent: It manages state primarily through chat logs, reasoning aloud to itself, and thrives at solo tasks like code writing or simple simulations. It builds on the classic User-Assistant model, remembering facts about the project or admin via conversation history. But for our swarm—handling real-time crypto research, multi-agent coordination, and persistent tasks like daily BTC options optimization—this model falls short.

ElizaOS, on the other hand, is designed as a conversational agent framework: It tracks each user (or agent) as a separate entity, building factual models over time while efficiently managing asynchronous, ongoing tasks. This means our specialists can:
- Run scheduled insights (e.g., 7-day strike recommendations) without blocking responses.
- Play out complex scenarios like regime aggregations.
- Spawn sub-agents—all while maintaining a Slack-native interface for human-in-the-loop feedback.

To clarify in the context of our project: All of our research is published on Substack, serving as our core context window. This structured, archival body of work—spanning BTC regimes, altcoin narratives, and macro overlays—feeds directly into Eliza's persistent state management. Unlike monologuing agents that rely on ephemeral chat logs, Eliza treats Substack as a foundational knowledge base: Agents reference it via tools (e.g., `web_search` for fresh posts or Postgres for cached summaries), ensuring outputs build on our proven edges without reinventing the wheel. This makes Eliza ideal for compounding small, validated insights into relentless alpha, as our swarm refines recommendations grounded in Substack's historical depth.

We don't expect most to grasp this mental model right away—it's subtle but powerful. We've maxed out every benchmark for agentic systems and are now creating new ones where monologuing agents simply can't compete, like handling concurrent, stateful interactions across a swarm without losing context. Coming from crypto's hype-driven world, where value is often measured in numbers and buzz, we've endured trial by fire: Numbers dip, critics emerge, but ElizaOS has proven itself as the most battle-tested agent framework, powering hundreds of projects. It's a near-perfect balance of tradeoffs—modular, extensible, and ready for the agentic future we're entering, where the question shifts from "What can agents do?" to "How can I build this with agents?"

As we push toward our MVP (validating 7-day BTC signals for superior yields) and the full vault (automating rolls via oracles like UMA/Polymarket), ElizaOS keeps us agile:
- Shared Postgres state for regimes and memory.
- Dynamic spawning for gap-filling.
- Slack hooks for rapid iterations.
