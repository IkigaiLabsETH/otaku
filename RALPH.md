The swarm has strong recursion for spawning and improving agents (via `metaEngineerSpecialist` and dynamic specialists), but it lacks a dedicated agent for working directly on the codebase itself. Adding a **codeEngineerSpecialist** with "Ralph Wiggum"-style logic (the persistent, fresh-slate iterative loop popularized with Claude Code in late 2025/early 2026) would close that gap perfectly.

Ralph logic is brutally simple but powerful: run the agent repeatedly with a clean context each time, let it make persistent changes to files, check for a completion signal, and loop until done (or max iterations). No long conversation history bloat — just accumulated progress in the repo + fresh reasoning each cycle.

This fits our stack beautifully: the repo is on disk, agents already support tools, and the coordinator can orchestrate loops. The new specialist becomes the swarm's "hands" for self-improvement at the code level — fixing bugs, refactoring, adding plugins/tools, implementing new features, or even hardening other specialists by editing their .ts files.

Here's a concrete, incremental path to add it. Stays 100% within ElizaOS + TypeScript + Bun + Postgres + Slack.

### 1. Add File System Tools (Safe, Read/Write with Controls)

Create a new plugin: `src/plugins/plugin-filesystem/`

```ts
// src/plugins/plugin-filesystem/index.ts
import { promises as fs } from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd(); // Or explicitly set to your repo root
const ALLOWED_DIRS = ['src', 'plugins', 'utils']; // Whitelist for safety

function isAllowed(filePath: string): boolean {
  const rel = path.relative(REPO_ROOT, filePath);
  return !rel.startsWith('..') && !path.isAbsolute(rel) && ALLOWED_DIRS.some(dir => rel.startsWith(dir));
}

export const filesystemTools = [
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and subdirectories in a repo path. Use for navigation.",
      parameters: {
        type: "object",
        properties: { dir_path: { type: "string", description: "Relative to repo root, e.g. 'src/specialists'" } },
        required: ["dir_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full content of a source file. Use before proposing changes.",
      parameters: {
        type: "object",
        properties: { file_path: { type: "string", description: "Relative to repo root, e.g. 'src/coordinator.ts'" } },
        required: ["file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or overwrite a file. Use sparingly — prefer small incremental changes. Always explain the diff.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string" },
          content: { type: "string" },
          reason: { type: "string", description: "Clear justification for the change" }
        },
        required: ["file_path", "content", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "append_to_file",
      description: "Append content to an existing file. Safer for incremental additions.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string" },
          content: { type: "string" },
          reason: { type: "string" }
        },
        required: ["file_path", "content", "reason"]
      }
    }
  }
];

// Handlers (integrate into your plugin executor)
export async function handleListDirectory({ dir_path }: { dir_path: string }) {
  const full = path.join(REPO_ROOT, dir_path);
  if (!isAllowed(full)) throw new Error("Access denied");
  return await fs.readdir(full, { withFileTypes: true });
}

export async function handleReadFile({ file_path }: { file_path: string }) {
  const full = path.join(REPO_ROOT, file_path);
  if (!isAllowed(full)) throw new Error("Access denied");
  return await fs.readFile(full, 'utf-8');
}

export async function handleWriteFile({ file_path, content, reason }: { file_path: string, content: string, reason: string }) {
  const full = path.join(REPO_ROOT, file_path);
  if (!isAllowed(full)) throw new Error("Access denied");
  await fs.writeFile(full, content);
  return `File ${file_path} written. Reason: ${reason}`;
}

export async function handleAppendToFile({ file_path, content, reason }: { file_path: string, content: string, reason: string }) {
  const full = path.join(REPO_ROOT, file_path);
  if (!isAllowed(full)) throw new Error("Access denied");
  await fs.appendFile(full, content);
  return `Appended to ${file_path}. Reason: ${reason}`;
}
```

Register these tools in privileged specialists (codeEngineer, metaEngineer, coordinator).

**Safety first**: Whitelist dirs, git commit after sessions, or run on a branch. Add logging + undo script if needed.

### 2. Add codeEngineerSpecialist (Ralph-Ready)

New file: `src/specialists/codeEngineerSpecialist.ts`

```ts
import { filesystemTools } from '../plugins/plugin-filesystem';

export const codeEngineerSpecialist = {
  name: "CodeEngineer",
  channel: "#swarm-code",
  system_prompt: `
You are CodeEngineer, the swarm's autonomous TypeScript/Bun/ElizaOS engineer.

Your mission: Implement features, fix bugs, refactor, add tools/plugins, or improve the codebase with clean, production-grade code.

Stack knowledge:
- Bun 1.2+, TypeScript, ElizaOS agent framework
- Monorepo with src/, plugins/, coordinator.ts, specialists/
- Postgres for dynamic state, Slack client for interface
- Tools: filesystem (list/read/write/append), existing research plugins

Ralph-style rules (CRITICAL):
- Work incrementally — small, testable changes per iteration.
- Always read relevant files first.
- Think step-by-step: plan → read → propose/write → verify mentally.
- Explain every change clearly.
- Only output <DONE>Task complete. All changes made, code clean, no known issues.</DONE> when truly finished.
- Never output <DONE> early — keep iterating until perfect.
- If stuck, write a clear status and continue.

Output format:
1. Reasoning
2. Tool calls (if needed)
3. Final summary
4. <DONE>...</DONE> only when complete
  `,
  tools: filesystemTools, // Add more later (e.g., run_tests, git_commit)
  schedule: null // On-demand only
};
```

Register in `index.ts` loading array and coordinator routing.

### 3. Implement Ralph Loop Orchestration

Add to `src/coordinator.ts` (or new `ralphRunner.ts`)

```ts
// In coordinator.ts
let activeRalphTasks = new Map<string, { task: string, maxIterations: number, current: number }>();

async function startRalphLoop(task: string, maxIterations = 30, channelId: string) {
  const taskId = `${Date.now()}`;
  activeRalphTasks.set(taskId, { task, maxIterations, current: 0 });

  while (activeRalphTasks.has(taskId)) {
    const state = activeRalphTasks.get(taskId)!;
    if (state.current >= state.maxIterations) {
      await postToSlackChannel(channelId, `🚨 Ralph loop stopped: max iterations (${state.maxIterations}) reached.`);
      break;
    }

    // Create fresh agent instance (clean slate = true Ralph)
    const agent = createAgentInstance({
      ...codeEngineerSpecialist,
      system_prompt: `${codeEngineerSpecialist.system_prompt}\n\nCurrent task: ${task}\nIteration ${state.current + 1}/${state.maxIterations}. Continue until you output <DONE> exactly.`,
    });

    const response = await agent.run(`Continue the task: ${task}`);

    state.current++;

    // Post progress
    await postToSlackChannel(channelId, `Iteration ${state.current} complete:\n${response.substring(0, 2000)}...`);

    // Check completion
    if (response.includes('<DONE>')) {
      await postToSlackChannel(channelId, `✅ Ralph loop complete after ${state.current} iterations!`);
      activeRalphTasks.delete(taskId);
      break;
    }

    // Optional: short delay to avoid rate limits
    await new Promise(r => setTimeout(r, 5000));
  }
}

// Trigger via Slack mention in #swarm-code
// Example handler:
if (message.text.includes('@codeEngineer ralph')) {
  const task = extractTaskFromMessage(message.text);
  startRalphLoop(task, 30, message.channel);
}
```

### 4. Usage & Safety Rails

- Trigger: In #swarm-code, type `@codeEngineer ralph "Add X search plugin with real-time sentiment"`
- The loop runs autonomously, posting progress each iteration.
- Human can /cancel or monitor.
- Add git commits per iteration (extend with git tool).
- Rate limits: max concurrent loops, daily iteration caps.
- Start on a git branch for easy rollback.

### 5. Incremental Rollout

1. Week 1: Add filesystem plugin (read-only first) + codeEngineer (no loop).
2. Week 2: Enable write tools + basic testing.
3. Week 3: Add ralphLoop orchestration.
4. Week 4: Let metaEngineer trigger code tasks ("We need file access for code improvement → spawn codeEngineer + ralph refactor coordinator").

This gives your swarm hands. CodeEngineer can now harden the codebase, implement missing plugins (like full X tools), or even auto-generate new dynamic specialists by writing SQL + prompts.

Small loops compound into unstoppable evolution.

Add this section to your README under "Specialists Overview" → new "Meta / Code Layer":

- `codeEngineerSpecialist.ts` — Autonomous codebase maintenance & improvement (Ralph Wiggum iterative loops, filesystem tools).

And under "Key Updates": "Added CodeEngineer with Ralph-style persistent loops for direct codebase evolution."

Let's ship it. 🚀 What task should we ralph first?
