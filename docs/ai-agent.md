# AI Agent Integration (Vercel AI SDK)

The starter ships an agent-ready AI stack built on the [Vercel AI SDK](https://ai-sdk.dev) v7:
a multi-step agent loop, a tool registry, a composable skill system, and a streaming chat UI.
Building your own agent means registering tools and skills — the loop, transport, auth, and UI
are already wired.

## Architecture

```
src/lib/ai/
├── models.ts              # Responses API provider + default model (env-configurable)
├── reasoning.ts           # Allowed reasoning effort levels and low default
├── artifacts.ts           # Shared Markdown/image/video artifact schema
├── chat-history.ts        # User-owned conversations and message persistence
├── chat-history-types.ts  # Shared conversation and UIMessage types
├── chat-attachments.ts    # Ownership and media validation for reference images
├── generated-image-storage.ts # Generated-image persistence through R2
├── response-chain.ts      # User-bound signed handles for previous_response_id
├── usage.ts               # Per-turn token accounting into ai_usage_events
├── context.ts             # AgentContext: per-request session data for tools
├── tools/                 # One file per tool
│   ├── index.ts           # Tool registry: name → factory, plus buildTools()
│   ├── get-current-time.ts
│   ├── get-account-overview.ts
│   ├── present-artifact.ts
│   └── knowledge-base.ts  # Search + read tools over site content
├── skills/
│   ├── types.ts           # AgentSkill: instructions + tool names
│   ├── compose.ts         # composeSkills
│   ├── account-support.ts # Example skill: account questions
│   ├── knowledge-base.ts  # Example skill: search → read → answer loop
│   └── index.ts           # Skill registry
└── agents/
    ├── assistant.ts       # Default agent definition
    └── index.ts           # Agent registry (resolved by id in the route)

src/app/api/ai/conversations/      # Conversation list, creation, and retrieval
src/app/api/chat/route.ts          # Auth + persistence + rate limit + streaming
src/app/dashboard/ai/              # Chat UI (useChat + tool-call rendering)
```

Request flow: the chat route authenticates the session, builds an `AgentContext`, resolves an
agent factory from the registry, and returns `createAgentUIStreamResponse`. The agent is a
`ToolLoopAgent`: it calls the model, executes tool calls, and loops until the model finishes
or `isStepCount` stops it.

The built-in assistant at `/dashboard/ai` is a working Chat + Canvas example composed from two skills:
`account-support` (looks up the signed-in user's profile and subscription) and
`knowledge-base` (a search → read → answer loop over the site's published articles — ask it
"does this product support API keys?" and watch it search, open the matching article, and
answer with a source link). Both run on real data; there are no mocks to remove.
Substantial Markdown drafts, returned image/video files, and generated images open in the adjacent
canvas, where users can switch artifacts, copy them, and download them.

Conversations and UI messages are stored under the authenticated user in PostgreSQL. The
responsive history panel supports creating, switching, archiving, and restoring conversations.
Its desktop rail can be collapsed, and the selected conversation is restored from the URL after
refresh or sign-in on another device. Generated image bytes are moved to the existing R2 upload
system before the assistant message is stored, so historical canvas results use durable URLs
instead of large base64 database values. The server also consumes a separate copy of each response
stream, so generation and final message persistence continue when the browser refreshes, closes,
or loses its connection. A process restart remains the execution boundary; deployments that need
jobs to survive application restarts should move generation to a durable queue.

Users can attach up to six PNG, JPEG, or WebP reference images to each message, including an
image-only message. The composer uploads them through the existing R2 flow before sending, and the
durable URLs are stored as UI message file parts. The chat route verifies every URL against an
upload owned by the authenticated user before passing it to the model, so clients cannot inject
arbitrary external images or another user's files. The supported formats follow the
[OpenAI image-input guidance](https://developers.openai.com/api/docs/guides/images-vision).

## Configuration

The stack uses the OpenAI Responses protocol so reasoning and function tools work together.
`LLM_BASE_URL` remains configurable for gateways that implement the Responses API.

| Setting            | Where                                                 | Notes                                    |
| :----------------- | :---------------------------------------------------- | :--------------------------------------- |
| Feature switch     | `SITE_CONFIG.features.ai` in `src/lib/config/site.js` | Gates the nav item, page, and API route. |
| `LLM_API_KEY`      | `.env`                                                | Required while the feature is enabled.   |
| `LLM_BASE_URL`     | `.env`                                                | Optional Responses API base URL.         |
| `AI_DEFAULT_MODEL` | `.env`                                                | Optional; defaults to `gpt-5.6-luna`.    |

The assistant defaults to `low` reasoning; the client may select `low`, `medium`, or `high` per
request. Image generation is intentionally fixed in code to GPT Image 2, low quality, WebP output,
and at most one built-in tool call per model response. The latest user request selects one of the
application's 1K presets: `1024x1024`, `1536x1024`, or `1024x1536`; unsupported dimensions are
mapped to the closest orientation instead of widening the output limit. These presets follow the
[official GPT Image 2 size guidance](https://developers.openai.com/api/docs/guides/image-generation#size-and-quality-options).
A custom gateway must support both the Responses protocol and the OpenAI image-generation built-in
tool for that feature to work.

To use another vendor, change `src/lib/ai/models.ts` only — for example install
`@ai-sdk/anthropic` and swap `createOpenAI` for `createAnthropic`. Tools, skills, agents, and
routes remain provider-agnostic.

## Adding a tool

Two steps: create the file, then register it.

```ts
// 1. src/lib/ai/tools/get-open-invoices.ts
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

```ts
// 2. src/lib/ai/tools/index.ts
export const agentTools = {
  // ...existing tools
  getOpenInvoices: createGetOpenInvoices,
} satisfies Record<string, (context: AgentContext) => ToolSet[string]>;
```

Every tool is a factory over `AgentContext`, so tools that need no context simply ignore the
argument. The registry key is the name the model sees, which means each name is defined exactly
once and two tools can never collide.

## Tools that change data

A tool that creates, updates, or deletes anything must set `needsApproval: true`. The dividing
line is whether the user could undo it: `presentArtifact` only shows a document, so it runs
freely; `saveDocument` writes an R2 object and consumes storage quota, so it asks first.

```ts
export function createSaveDocument(context: AgentContext) {
  return tool({
    description: "Save a Markdown document to the user's files.",
    inputSchema: z.object({ fileName: z.string(), content: z.string() }),
    needsApproval: true,
    execute: async ({ fileName, content }) => {
      /* ... */
    },
  });
}
```

The tool loop then pauses instead of executing, and the stream emits an approval request the UI
renders as a confirmation card (`ToolApprovalCard` in
`src/app/dashboard/ai/_components/chat-panel.tsx`). `useChat`'s `addToolApprovalResponse` records
the answer and `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`
resumes the loop.

The approval itself travels through the client, so it is signed. `withToolApprovalSecret` in
`src/lib/ai/tool-approval.ts` attaches an HMAC key derived from `BETTER_AUTH_SECRET` to every
agent; the SDK signs each approval request and verifies the response before executing the tool.
**This is not optional.** When no secret is configured the SDK skips verification entirely, and a
crafted request body can approve its own tool call — the gate becomes decoration. That failure is
silent, which is why the secret is derived rather than read from a separate environment variable,
and why `src/lib/ai/tool-approval.test.ts` asserts that an unsigned approval is rejected.

A denied call ends up in the `output-denied` state and the model is told the user refused, so
tools should still return a plain result object on business failures (quota exhausted, file too
large) rather than throwing.

## Adding a skill

A skill bundles a system-prompt fragment with the tools it needs, so one import gives an agent
both the knowledge and the capability:

```ts
// src/lib/ai/skills/invoicing.ts
import type { AgentSkill } from "./types";

export const invoicingSkill: AgentSkill = {
  id: "invoicing",
  instructions: `Use the getOpenInvoices tool before answering invoice questions; never guess amounts.`,
  toolNames: ["getOpenInvoices"],
};
```

Register it in `src/lib/ai/skills/index.ts`, then add it to an agent's skill list. Skills
reference tools by registry name, so `toolNames` is type-checked and two skills may share a
tool without conflict. Prompt-only skills (tone, policies, escalation rules) omit `toolNames`.

## Adding an agent

Agents are request-scoped `ToolLoopAgent` instances composed from skills:

```ts
// src/lib/ai/agents/support.ts
export function createSupportAgent(
  context: AgentContext,
  options: CreateAgentOptions,
) {
  const { instructions, toolNames } = composeSkills([
    agentSkills.accountSupport,
    agentSkills.invoicing,
  ]);
  return new ToolLoopAgent({
    model: getChatModel(),
    reasoning: options.reasoningEffort,
    instructions: `You are the support agent. ...\n\n${instructions}`,
    tools: buildTools(toolNames, context),
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
- Requires a user-owned `conversationId`; another user's or a missing conversation returns `404`.
- Accepts only `low`, `medium`, or `high` reasoning effort and defaults to `low`.
- Accepts at most six PNG, JPEG, or WebP reference images per user message and verifies each
  image against the authenticated user's upload records.
- Streams a UI message response, including tool-call parts the client can render.
- Provider errors are logged server-side and masked in the stream; a misconfigured agent
  answers `500` and an unusable message payload answers `400`, neither leaking details.

`AgentContext` is built from the session on the server, so no field a client sends can widen
what a tool may read.

Successful turns expose a signed, user-bound response handle in message metadata. On the next
turn the client sends only messages created after that response, and the server verifies the
handle before using the underlying Responses API `previous_response_id`. This keeps generated
image payloads out of later request bodies and prevents a client from chaining to another user's
response. Provider response storage is enabled because native response chaining requires it.
The user message is stored before the stream is returned, while the completed assistant message
is stored by the stream end callback. Regeneration updates the existing assistant message and
cannot overwrite a message with a different role.

The dashboard page at `/dashboard/ai` follows the AI Elements conversation, reasoning,
prompt-input, tool-status, and artifact patterns while reusing this repository's shadcn primitives
and design tokens. Wide desktop layouts add persistent history beside the split Chat + Canvas
workspace; narrower screens open history and Canvas in independent full-height sheets.

## Usage accounting

Every completed assistant turn writes one `ai_usage_events` row: the user, conversation, message,
agent, model, reasoning effort, token counts, finish reason, and duration. This is the data layer
for cost attribution, quotas, and usage-based billing — request-count rate limiting cannot express
that a `high` reasoning turn costs far more than a lookup.

Two details are easy to get wrong:

- **Usage does not reach `onEnd`.** The AI SDK's stream-end event carries `finishReason` but no
  token counts. Those arrive on stream parts, so `src/app/api/chat/route.ts` captures `totalUsage`
  from the `finish` part and `response.modelId` from `finish-step` into closure variables, then
  writes one row from `onEnd`. Do not put usage into the `messageMetadata` return value — that is
  sent to the client.
- **The row counts language-model tokens only.** `generateImage` runs as a provider-executed tool,
  and its image tokens never appear in `LanguageModelUsage`. Image spend is billed but not captured
  here; costing that feature needs a separate source.

The `model` column records the model that served the final step. That is accurate only while a
single chat model serves the whole loop, which is today's configuration; introducing per-step model
selection would require per-step rows instead of one row per turn.

Token columns are nullable throughout. A provider that reports no cache tokens is not the same as
one reporting zero, and `extractUsageTotals` in `src/lib/ai/usage.ts` preserves that distinction
rather than defaulting to `0`. Accounting failures are logged and swallowed: a bookkeeping error
must never cost the user their reply. `messageId` carries no foreign key, and regenerating a turn
overwrites the message row while leaving a usage row per attempt — sum by user or conversation, not
by message.

## Testing

Agent code is unit-testable with Jest. The AI SDK packages are ESM-only, so they are listed in
`transpilePackages` in `next.config.ts` (which `next/jest` also uses), and `jest.setup.ts`
polyfills `TransformStream` for jsdom.

Patterns to copy: call a tool's `execute` directly (`tools/*.test.ts`), compose skills without a
context (`skills/compose.test.ts`), and cover a route by mocking session, rate limit, and agent
(`src/app/api/chat/route.test.ts`). `e2e/ai-assistant.spec.ts` covers the page and the route's
rejection paths without calling a model, so it needs no provider credentials.
