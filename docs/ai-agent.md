# AI Agent Integration (Vercel AI SDK)

The starter ships an agent-ready AI stack built on the [Vercel AI SDK](https://ai-sdk.dev) v7:
a multi-step agent loop, a tool registry, a composable skill system, and a streaming chat UI.
Building your own agent means registering tools and skills — the loop, transport, auth, and UI
are already wired.

## Architecture

```
src/lib/ai/
├── models.ts              # Provider + default model (OpenAI-compatible, env-configurable)
├── context.ts             # AgentContext: per-request session data for tools
├── tools/                 # One file per tool
│   ├── get-current-time.ts    # Static tool (no context)
│   ├── get-account-overview.ts # Context-aware tool factory
│   └── knowledge-base.ts      # Search + read tools over site content
├── skills/
│   ├── types.ts           # AgentSkill: instructions + tools bundle
│   ├── compose.ts         # composeSkills / mergeToolSets
│   ├── account-support.ts # Example skill: account questions
│   ├── knowledge-base.ts  # Example skill: search → read → answer loop
│   └── index.ts           # Skill registry
└── agents/
    ├── assistant.ts       # Default agent definition
    └── index.ts           # Agent registry (resolved by id in the route)

src/app/api/chat/route.ts          # POST /api/chat: auth + rate limit + streaming
src/app/dashboard/ai/              # Chat UI (useChat + tool-call rendering)
```

Request flow: the chat route authenticates the session, builds an `AgentContext`, resolves an
agent factory from the registry, and returns `createAgentUIStreamResponse`. The agent is a
`ToolLoopAgent`: it calls the model, executes tool calls, and loops until the model finishes
or `isStepCount` stops it.

The built-in assistant at `/dashboard/ai` is a working example composed from two skills:
`account-support` (looks up the signed-in user's profile and subscription) and
`knowledge-base` (a search → read → answer loop over the site's published articles — ask it
"does this product support API keys?" and watch it search, open the matching article, and
answer with a source link). Both run on real data; there are no mocks to remove.

## Configuration

The stack is provider-neutral: any OpenAI-compatible endpoint works out of the box (the OpenAI
API, LLM gateways, proxies, or local runtimes), so no vendor is hard-wired.

| Setting            | Where                                                 | Notes                                    |
| :----------------- | :---------------------------------------------------- | :--------------------------------------- |
| Feature switch     | `SITE_CONFIG.features.ai` in `src/lib/config/site.js` | Gates the nav item, page, and API route. |
| `LLM_API_KEY`      | `.env`                                                | Required while the feature is enabled.   |
| `LLM_BASE_URL`     | `.env`                                                | Optional; defaults to the OpenAI API.    |
| `AI_DEFAULT_MODEL` | `.env`                                                | Optional; defaults to `gpt-5.6-luna`.    |

To use a vendor-specific SDK instead (for provider-only features such as native reasoning
options), change `src/lib/ai/models.ts` only — for example install `@ai-sdk/anthropic` and swap
`createOpenAICompatible` for `createAnthropic`. Tools, skills, agents, the route, and the UI
are provider-agnostic.

## Adding a tool

A tool is a typed function the model can call. Static tools export a `tool()` directly;
tools that need the signed-in user take the context through a factory:

```ts
// src/lib/ai/tools/get-open-invoices.ts
import { tool } from "ai";
import { z } from "zod";
import type { AgentContext } from "../context";

export function createGetOpenInvoices(context: AgentContext) {
  return tool({
    description: "List the signed-in user's open invoices.",
    inputSchema: z.object({
      limit: z.number().int().positive().max(20).default(5),
    }),
    execute: async ({ limit }) => {
      // context.userId comes from the session, never from the model.
      return listOpenInvoices(context.userId, limit);
    },
  });
}
```

Attach it to a skill (preferred) or directly to an agent's tool set. Tool names must be unique
per agent; `mergeToolSets` throws on collisions.

## Adding a skill

A skill bundles a system-prompt fragment with the tools it needs, so one import gives an agent
both the knowledge and the capability:

```ts
// src/lib/ai/skills/invoicing.ts
import type { AgentSkill } from "./types";
import { createGetOpenInvoices } from "../tools/get-open-invoices";

export const invoicingSkill: AgentSkill = {
  id: "invoicing",
  description: "Answers questions about the user's invoices.",
  instructions: `Use the getOpenInvoices tool before answering invoice questions; never guess amounts.`,
  tools: (context) => ({
    getOpenInvoices: createGetOpenInvoices(context),
  }),
};
```

Register it in `src/lib/ai/skills/index.ts`, then add it to an agent's skill list. Prompt-only
skills (tone, policies, escalation rules) simply omit `tools`.

## Adding an agent

Agents are request-scoped `ToolLoopAgent` instances composed from skills:

```ts
// src/lib/ai/agents/support.ts
export function createSupportAgent(context: AgentContext) {
  const { instructions, tools } = composeSkills(
    [agentSkills.accountSupport, invoicingSkill],
    context,
  );
  return new ToolLoopAgent({
    model: getChatModel(),
    instructions: `You are the support agent. ...\n\n${instructions}`,
    tools,
    stopWhen: isStepCount(10),
  });
}
```

Add the factory to `agentFactories` in `src/lib/ai/agents/index.ts`; the chat route then accepts
`{ "agentId": "support" }` in the request body (default is `assistant`).

## The chat API

`POST /api/chat` expects a Vercel AI SDK UI message payload (`useChat` sends it automatically):

- Session cookie auth; `401` without a signed-in user.
- Rate limited per user (30 requests / 10 minutes, `ai_chat` scope).
- Body capped at 512 KB and 80 messages.
- Streams a UI message response, including tool-call parts the client can render.
- Provider errors are logged server-side and masked in the stream.

The dashboard page at `/dashboard/ai` is a reference client: `useChat` +
`DefaultChatTransport`, markdown rendering for assistant text, and status chips for tool calls.

## Testing

Agent code is unit-testable with Jest. The AI SDK packages are ESM-only, so they are listed in
`transpilePackages` in `next.config.ts` (which `next/jest` also uses), and `jest.setup.ts`
polyfills `TransformStream` for jsdom. See `src/lib/ai/skills/compose.test.ts` and
`src/lib/ai/tools/get-current-time.test.ts` for patterns: call a tool's `execute` directly, and
test skill composition with plain fake tools.
