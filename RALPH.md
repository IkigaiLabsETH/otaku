# RALPH.md: Autonomous Code Iteration Loop (Inspired by Ralph Wiggum Technique)

## Overview
RALPH is a persistent, fresh-slate iterative loop for `codeEngineerSpecialist` to handle codebase tasks autonomously. Inspired by Geoffrey Huntley's 2025 bash loop and Matt Pocock's agile adaptation, it processes one requirement at a time until completion, enforcing focus and reducing context bloat.

- **Why Ralph?** It enables hands-off evolution (e.g., agents fixing agents), turning the swarm into a self-hardening ecosystem. No long conversation history—progress accumulates in the repo, DB, and Slack.
- **Core Loop**: Fresh LLM instance per iteration; check for `<DONE>` signal; max iterations to prevent runaway.
- **Stack Fit**: Leverages ElizaOS agents, filesystem tools, Postgres for requirements/state, Slack for real-time monitoring.
- **Guardrails**: Start with `RALPH_GUIDE.md` for conventions; git commits and auto-tests per iteration; human approval for sensitive changes.

The swarm already has recursion via `metaEngineerSpecialist` for spawning agents, but RALPH gives it "hands" for direct codebase work—fixing bugs, refactoring, adding plugins (e.g., full X tools), or editing specialist files.

## Process
1. **Generate Requirements**: Trigger `codeEngineer` or `metaEngineer` to create a `PRD.json` from a high-level task (e.g., "Add X search plugin"). Store in Postgres for persistence and shared access.
   - Adapted Schema (JSON array of objects):
     ```json
     {
       "sprints": [
         [
           {
             "id": "unique-string",
             "category": "functional",  // functional, non-functional, test, etc.
             "description": "One-sentence feature summary",
             "steps": ["Step 1", "Step 2"],  // Success criteria / tests
             "dependencies": ["id-of-prereq"],  // For prioritization
             "passes": false  // Completion status
           }
         ]
       ]
     }
     ```
   - **Key Improvement**: Auto-split large PRDs into small sprints (max 10-15 features each) with dependencies. This cuts token bloat from repeated full-context scans.

2. **Run the Loop**: Trigger via Slack (`@codeEngineer ralph "Task"`) or `metaEngineer` tool call. Implements nested loops (sprints > iterations).
   - Enhanced Base Script (in `src/utils/ralphRunner.ts` or `coordinator.ts`):
     ```ts
     import { exec } from 'child_process';  // For git/tests; promisify as needed

     let activeRalphTasks = new Map<string, { task: string, maxIterations: number, currentSprint: number, currentIteration: number, tokenUsage: number }>();

     async function startRalphLoop(task: string, maxIterations = 30, channelId: string) {
       const taskId = `${Date.now()}`;
       activeRalphTasks.set(taskId, { task, maxIterations, currentSprint: 0, currentIteration: 0, tokenUsage: 0 });

       // Generate/plan sprints if not in DB
       const prd = await loadOrGeneratePRD(task);  // LLM call or Postgres fetch; split into sprints

       while (activeRalphTasks.has(taskId)) {
         const state = activeRalphTasks.get(taskId)!;
         const sprint = prd.sprints[state.currentSprint];
         if (!sprint) {
           await postToSlackChannel(channelId, `✅ All sprints complete! Total iterations: ${state.currentIteration}. Token usage: ${state.tokenUsage}.`);
           activeRalphTasks.delete(taskId);
           break;
         }

         if (state.currentIteration >= maxIterations) {
           await postToSlackChannel(channelId, `🚨 Sprint ${state.currentSprint} stopped: max iterations reached.`);
           break;
         }

         // Fresh agent instance
         const agent = createAgentInstance({
           ...codeEngineerSpecialist,
           system_prompt: `${codeEngineerSpecialist.system_prompt}\n\nLoad RALPH_GUIDE.md conventions.\nSprint ${state.currentSprint + 1}: Process next unmet requirement. Update PRD in DB. Commit to git. Run tests.\nIf stuck, output <STUCK>Reason</STUCK>.`,
         });

         const response = await agent.run(`Continue sprint ${state.currentSprint + 1}: ${task}`);
         state.tokenUsage += estimateTokens(response);  // Track costs

         // Auto-commit + test
         await gitCommit(`Ralph sprint ${state.currentSprint} / iter ${state.currentIteration}: ${getChangeSummary(response)}`);
         const testResult = await runTests();
         if (testResult.failed) {
           await gitRollback();  // Revert commit
           await postToSlackChannel(channelId, `❌ Tests failed—rolled back. Alerting #swarm-meta.`);
         }

         await postToSlackChannel(channelId, `Sprint ${state.currentSprint + 1} / Iter ${state.currentIteration + 1}: ${response.slice(0, 1000)}...\nTests: ${testResult.status}\nTokens: ${state.tokenUsage}`);

         if (response.includes('<DONE>')) {
           state.currentSprint++;
           state.currentIteration = 0;  // Reset per sprint
         } else if (response.includes('<STUCK>')) {
           await postToSlackChannel('#swarm-meta', `🛑 Stuck in Ralph loop: ${extractStuckReason(response)}. Human review needed.`);
           break;
         }

         state.currentIteration++;
         await new Promise(r => setTimeout(r, 5000));  // Rate limit delay
       }
     }
     ```
   - **Improvements**:
     - **Nested Sprints**: LLM plans dependencies upfront; outer loop handles sprints, inner handles iterations—reduces reasoning overhead.
     - **Intermediate Visibility**: Slack posts include token usage and test status; thread all in one channel for audit trail (like progress.txt).
     - **Completion Signals**: `<DONE>` for sprint end; new `<STUCK>` for self-halt and alert.

3. **Tools & Guardrails**
   - **Filesystem Tools**: As defined (list/read/write/append); whitelist dirs for safety.
   - **New: Git Tool** (in `plugin-git` or extend filesystem):
     ```ts
     tools.push({
       type: "function",
       function: {
         name: "git_commit",
         description: "Commit changes to git. Run after successful tests.",
         parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] }
       }
     });
     // Handler:
     async function handleGitCommit({ message }) {
       await execPromise('git add . && git commit -m "${message}"');
       return `Committed: ${message}`;
     }
     ```
     - **Why?** Enables per-iteration history/rollbacks; run on a feature branch (e.g., `git checkout -b ralph-${taskId}`).
   - **New: Testing Tool**:
     ```ts
     tools.push({
       type: "function",
       function: {
         name: "run_tests",
         description: "Run codebase tests. Fail if errors.",
         parameters: {}
       }
     });
     // Handler:
     async function handleRunTests() {
       const result = await execPromise('bun test');  // Or vitest/jest
       return { status: result.success ? 'passed' : 'failed', output: result.stdout };
     }
     ```
     - **Why?** Catches regressions; add unit tests for agents/plugins, integration for swarm flows. For frontend, integrate Playwright.
   - **RALPH_GUIDE.md**: Dedicated file with conventions (e.g., "TypeScript only; multi-file modular structure; no unapproved deps; test every change; prefer small diffs"). Auto-load into every prompt to minimize re-contextualization.

4. **Safety & Monitoring**
   - **Rate Limits**: Max 2 concurrent loops; 100 iterations/day total; cap token budget per task.
   - **Human Gates**: Post PRD proposals to `#swarm-approval` for review/✅ before loop starts (especially for core files).
   - **Token Optimization**: Smaller sprints + `RALPH_GUIDE.md` reduce waste; log usage in Postgres table for analysis.
   - **Rollback & Audit**: Git for reverts; Slack threads as progress.txt equivalent; auto-deactivate on failures.
   - **Parallel Scaling**: Future: `metaEngineer` spawns multiple `codeEngineer` instances for parallel sprints, synced via shared PRD in DB.

5. **Example Usage**
   - **Task**: "Implement full X/Twitter search plugin for altcoin specialists."
   - **Flow**: Generates PRD.json (API wrappers, schemas, integration); nested loops execute; commits/tests per iter; posts to `#swarm-code`.
   - **Trigger Integration**: Extend `metaEngineer` tools to call `startRalphLoop` on detected gaps (e.g., "Missing git tool → ralph add it").

## Reflections on Our Swarm
Real-world experiments (like the SQLite UI) validate RALPH's power for greenfield/complex tasks but highlight risks like bloat and breakage. Our Postgres/Slack enhancements make it swarm-native: persistent, visible, and recursive. With these tweaks, `codeEngineer` safely scales—e.g., autonomously completing "in progress" README items. Start with trivial tests; small loops compound into unstoppable alpha.

## Incremental Rollout
1. **Week 1**: Filesystem plugin (read-only) + `codeEngineer` specialist.
2. **Week 2**: Write tools + git/testing integrations.
3. **Week 3**: Nested loop orchestration + `RALPH_GUIDE.md`.
4. **Week 4**: `metaEngineer` triggers + full safety rails.

Add to README: Under "Specialists Overview" → "Meta / Code Layer": `- codeEngineerSpecialist.ts — Autonomous codebase evolution via RALPH loops.` Under "Key Updates": "Integrated RALPH for self-improving code via `codeEngineer`."

Ship it iteratively. 🚀 What trivial task to ralph first?
