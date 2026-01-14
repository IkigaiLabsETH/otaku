Target user: Developers who want to prototype AI agents fast. 
They'll clone, run, and decide in 10 minutes if it's useful.
They won't read a wall of text. They'll scan the README for a quickstart.

Setup requirements:
- Maximum 3 environment variables (API keys only)
- Single requirements.txt, no complex dependency chains
- "pip install + run" in under 5 minutes or they bounce

Tech stack:
- Python and Typescript only
- Streamlit for UI (fast to build, easy to understand)
- OpenAI/Anthropic/Google AI SDKs directly, minimal abstraction layers

What gets stars:
- Solves a real problem people actually have (not a toy demo)
- Code is readable without extensive comments
- Easy to extend or modify for their own use case
- Good README with a GIF or screenshot showing it working

What doesn't land:
- "Hello world" level demos (too basic)
- Overly complex architectures for simple problems
- Agents that require 10+ minutes of config before first run

Common failure patterns to avoid:
- Context window overflow on long conversations
- Tool call loops where agent gets stuck
- Unclear error messages when API calls fail
- No graceful handling of rate limits

Agent patterns that work:
- Single-purpose agents that do one thing well
- Multi-agent systems with clear role separation
- Coordinator pattern for complex workflows
- Human-in-the-loop for high-stakes decisions
