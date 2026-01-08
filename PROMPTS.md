# Effective Prompts for Vibe Coding with LLMs on Ikigai Studio Research Tools

If you speak in detail to LLMs and vibe coding tools, they craft magical stuff.

That's essentially what good prompting is.

However, there come certain times in your vibe coding journey when you need some essential prompts that actually help instantly.

This will be a good read for those who want to learn how to write effective prompts, as understanding them will enable you to communicate more effectively with your vibe coding tool next time a similar issue arises.

Still save this at the end, in case you need them, as they will be pretty helpful as copy-pasteable prompts. 

I have already prepared the parts you need to modify, highlighted as bold/italic/scored text within **[like this]**.

Let's start:

---

## 1. The PRD Generator

I want to build **[a new specialist agent or plugin for the Ikigai multi-agent swarm]**.  
Before writing any code, create a PRD with:  
1. Problem Statement: What problem does this solve? Who has it?  
2. User Stories: 5-7 stories in "As a [user], I want [action] so that [benefit]" format  
3. Core Features (MVP only): What's essential for v1? Be ruthless.  
4. Out of Scope: What waits for v2?  
5. Tech Requirements: Stack, integrations, data models, auth needs (e.g., ElizaOS, TypeScript, Bun, Postgres)  
6. Success Metrics: How do we know it works?  
7. Open Questions: What needs deciding before we build?  
Be specific, not generic.

---

## 2. The Architecture Analyzer Prior To A Key New Feature That Wasn't Thought Out

Analyze this codebase and give me:  
1. Architecture pattern (e.g., monorepo with Bun/Turbo, ElizaOS server)  
2. Data flow: user input → API → database → UI (consider Slack integration or web frontend)  
3. Key files: Where is routing? Models? Auth? Business logic? (e.g., index.ts, coordinator.ts, specialists/)  
4. Critical dependencies and what they do (e.g., ElizaOS, React, Vite, Tailwind)  
5. Patterns I need to follow for new features (show examples from the code)  
6. Potential issues (security, performance, outdated patterns in crypto plugins)  
7. If I wanted to add **[a new crypto specialist or plugin]**, which files would I touch?  
Read entire files first. Don't assume.

---

## 3. The Implementation Plan

I need to implement this **[PRD or new swarm feature like a Deribit plugin]**.  
Before writing code, create an implementation plan:  
**Phase 1 - Analysis:**  
- What existing code does this touch?  
- What new files needed?  
- Dependencies between tasks?  
**Phase 2 - Data:**  
- Schema changes (e.g., Postgres for persistent state)  
- New endpoints  
- Validation rules  
**Phase 3 - Backend:**  
- Business logic (e.g., in TypeScript specialists)  
- Error handling  
- Edge cases  
**Phase 4 - Frontend:**  
- Components needed (if using optional React UI)  
- State management  
- User feedback  
**Phase 5 - Integration:**  
- How pieces connect (e.g., swarm orchestration, Slack events)  
- Testing approach  
- Rollback plan  
For each phase: complexity (simple/medium/complex) and specific files.  
DO NOT write code. I need to approve this first.

---

## 4. The Scope Killer

I'm building **[a new swarm specialist like Polymarket data puller]**. Be my ruthless scope guardian.  
1. Minimum Viable Version: What's the absolute simplest version that delivers value?  
2. NOT Building Yet: Nice-to-haves, edge cases for <5% of users, premature optimizations  
3. Definition of Done: What criteria = shipped?  
4. Time Traps: What will take 10x longer than expected? (e.g., API integrations with CoinGecko or DeFiLlama)  
5. The One Thing: If I could only ship ONE capability, what should it be?  
Be aggressive. I can always add more later.

---

## 5. The Debugger

I'm stuck in a debugging loop. The bug: **[describe it, e.g., swarm agent not posting to Slack channel]**  
You already tried many things that didn't work; analyze what didn't help first. Before suggesting fixes:  
1. List 5-7 different new possible causes. Consider:  
- Data issue, not code?  
- Environment/config? (e.g., Slack tokens in .env)  
- Race condition/timing?  
- Caching?  
- Bug is somewhere else entirely? (e.g., ElizaOS core)  
2. Rank by likelihood  
3. For top 2: add diagnostic logs to prove/disprove each. Don't fix yet.  
4. Only after we confirm the cause do we fix.

---

## 6. The Tech Debt Audit

Audit this codebase for technical debt. Prioritized list I can act on.  
Find:  
1. Duplicated code that should be extracted (e.g., in plugins or specialists)  
2. Dead code (unused files, functions, exports)  
3. Outdated patterns, deprecated APIs (e.g., in Otaku extensions)  
4. Missing error handling  
5. Security smells (hardcoded secrets, SQL concat, missing validation in crypto ops)  
6. Performance issues (N+1, missing indexes, unnecessary re-renders in React)  
7. Type safety gaps (any types, missing validation in TypeScript)  
For each: file/line, what's wrong, risk (low/med/high), suggested fix.  
Sort by risk, highest first.

---

## 7. The Code Cleaner

I have duplicate code that needs consolidation.  
1. Find all instances. List them.  
2. What's different between each? Do differences matter?  
3. Create ONE shared utility that handles all cases. Flexible but not complicated.  
4. Migration plan: before/after for each file  
5. Risk assessment: What could break? (e.g., swarm coordination)  
Do this incrementally. One pattern at a time.  
Also find and remove dead code.  
Look for:  
1. Unused exports (exported but never imported)  
2. Commented-out code  
3. Unreachable code (after returns, impossible conditions)  
4. Unused dependencies in package.json (e.g., Bun/Turbo related)  
5. Orphan files (not imported anywhere)  
6. Old feature flags (always true/false)  
For each: what, where, how you confirmed unused, safe to delete?  
DON'T delete dynamically imported code. Flag those for manual review.

---

## 8. The Security Audit

Security audit before production.  
Check:  
1. Injection: SQL injection, command injection, XSS (e.g., in web frontend or Slack outputs)  
2. Auth: Hardcoded secrets, weak passwords, missing rate limiting, non-expiring sessions (e.g., CDP wallet)  
3. Authorization: IDOR, missing auth checks, bypassable role checks  
4. Data exposure: Sensitive data in logs, stack traces to users, PII leaks (e.g., API keys)  
5. Config: Debug mode, permissive CORS, missing security headers  
For each issue: severity, file/line, how to exploit, how to fix with code.  
Be thorough. Ultrathink.

---

## 9. The Pre-Launch Checklist

Deploying to production. Run pre-launch checklist:  
**Environment:**  
- Secrets in env vars (not hardcoded)? (e.g., SLACK_BOT_TOKEN, API keys)  
- Different configs for dev/prod?  
- .env.example exists?  
- Debug mode off?  
**Security:**  
- Auth on sensitive routes? (e.g., wallet features)  
- Rate limiting on public endpoints?  
- Input validation everywhere? (e.g., in plugins)  
- HTTPS enforced?  
- Security headers set?  
**Errors:**  
- Global error handler?  
- Friendly errors to users?  
- Errors logged with context?  
**Database:**  
- Migrations current? (Postgres)  
- Indexes on queried columns? (e.g., for multi-year series)  
- Connection pooling?  
For each:  
✅ Good,  
⚠️ Needs attention (what to fix),  
or ❌ Missing (how to add).

---

## 10. The Critical Path Tester

Generate tests for critical paths.  
Critical = if broken, would lose money, lose data, lock users out, or cause security issues.  
Test:  
1. Auth flows:  
- Signup valid → user created  
- Signup existing email → error  
- Login correct → session  
- Login wrong → rejected, no info leak  
- Protected route without auth → redirect (if using web frontend)  
2. Data mutations (create/update/delete):  
- Happy path  
- Invalid data rejected  
- Can't mutate others' data  
- Failed mutation = no partial state (e.g., in Postgres state)  
3. Payments (if applicable):  
- Happy path (e.g., CDP wallet swaps)  
- Webhook success  
- Webhook failure  
- No paid features without paying  
Use **[Vitest or Bun's built-in test runner]**. AAA pattern. Test behavior not implementation. Independent tests.  
Generate actual test files.

---

## 11. The Design System Extractor

Extract a design system from this codebase.  
Find and standardize:  
1. Colors: Scan for hex/rgb. Categorize (primary, secondary, bg, text, success, error). Create CSS variables (integrate with Tailwind).  
2. Typography: Fonts, sizes, weights. Create a scale.  
3. Spacing: Margins, padding, gaps. Create consistent scale (4, 8, 16, 24, 32px).  
4. Components: Repeating patterns (buttons, cards, inputs). Create base + variants (using Radix UI).  
5. Shadows/Borders: Standardize to 2-3 options each.  
Output:  
1. Design tokens file  
2. When to use what  
3. Inconsistencies to fix  
4. Migration plan  
Make it practical. I should use this tomorrow.

---

## 12. The Security Fixer

Fix all these vulnerabilities:  
**[paste Master AI fix prompt after doing a scan with vibeship scanner]**

---

## Bonus: The Ultrathink 

Add this anytime you need your vibe coding LLM to ultrathink, write it together for best results:

Ultrathink.
