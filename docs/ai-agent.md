# AI Agent Integration (Vercel AI SDK)

The starter ships an agent-ready AI stack built on the [Vercel AI SDK](https://ai-sdk.dev) v7:
a multi-step agent loop, a tool registry, a composable skill system, and a streaming chat UI.
Building your own agent means registering tools and skills — the loop, transport, auth, and UI
are already wired.

## Architecture

```
src/lib/ai/
├── models.node.ts              # Responses API provider + default model (env-configurable)
├── runtime.node.ts        # Database/storage/model dependencies for the Node Worker
├── generation-worker.ts  # Durable ai.generate job; bounded SDK consumption
├── durable-runs.ts       # Owned run state, batched events, cancellation and reconciliation
├── event-stream.ts       # Cursor replay; browser disconnect ends only this subscriber
├── reasoning.ts           # Allowed reasoning effort levels and low default
├── artifacts.ts           # Shared Markdown/image/video artifact schema
├── chat-history.ts        # User-owned conversations and message persistence
├── chat-history-types.ts  # Shared conversation and UIMessage types
├── chat-attachments.ts    # Ownership and media validation for reference images
├── runs.ts                # Web wrapper over the Node-safe run repository
├── run-repository.ts      # Admission, response persistence and accounting recovery
├── finalize.ts            # Retryable generated-image persistence
├── transcript.ts          # Server-owned history and approval validation
├── response-chain.ts      # User/conversation-bound signed handles for previous_response_id
├── usage.ts               # Provider usage normalization
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
│   ├── document-storage.ts # Approved document storage
│   └── index.ts           # Skill registry
└── agents/
    ├── assistant.ts       # Default agent definition
    └── index.ts           # Agent registry (resolved by id in the route)

src/app/api/ai/conversations/      # Conversation list, creation, and retrieval
src/app/api/chat/route.ts          # Auth + rate limit + transactional admission (202)
src/app/api/ai/runs/[runId]/       # Owned state, cursor SSE replay and explicit cancel
src/app/dashboard/ai/              # Chat UI (useChat + tool-call rendering)
```

Request flow: Web authenticates and validates one new user message or signed approval decision.
One PostgreSQL transaction merges server-owned history and accepts the message, `ai_runs` row,
task, and existing dispatch outbox. `POST /api/chat` returns `202` with a stable run and assistant
message ID; retrying the request ID returns the accepted run. The existing pg-boss dispatcher
hands `ai.generate` to the Node Worker, which rechecks current ownership, ban state and attachments,
then builds the same `ToolLoopAgent` and consumes `createAgentUIStream` independently of Web.
The agent calls the model, executes approved tools and loops until completion or `isStepCount`.

The built-in assistant at `/dashboard/ai` is a working Chat + Canvas example composed from three skills:
`account-support` (looks up the signed-in user's profile and subscription) and
`knowledge-base` (a search → read → answer loop over the site's published articles — ask it
"does this product support API keys?" and watch it search, open the matching article, and
answer with a source link), plus `document-storage` for approved document writes.
These skills run on real data; there are no mocks to remove.
Substantial Markdown drafts, returned image/video files, and generated images open in the adjacent
canvas, where users can switch artifacts, copy them, and download them.

Conversations and UI messages are stored under the authenticated user in PostgreSQL. The
responsive history panel supports creating, switching, archiving, and restoring conversations.
Its desktop rail can be collapsed, and the selected conversation is restored from the URL after
refresh or sign-in on another device. History is paginated in batches of 80 messages.
The server accepts one new message or approval decision with a parent ID and derives the
provider response handle from stored history. Each user and conversation may have one queued
or running response. Execution has a three-minute abort, five-step limit and 4096 output-token
limit. The Worker batches UI chunks into PostgreSQL every 100 ms or 64 chunks; generated image
bytes are stored in R2 before their event exposes an authenticated URL. Storage outages expose
an explicit pending result and retain the recoverable image only in the owned run record.

`GET /api/ai/runs/{runId}/stream?cursor=0` replays standard SDK SSE chunks with monotonic event
IDs, then follows new events. Cursor reconnects skip already received events. Refresh rebuilds
from persisted history and replays the active run; history and active ownership share a consistent
snapshot. Closing a tab or restarting Web has no effect on generation. Terminal chunks remain
hidden until the final message, status and accounting payload commit. Accounting and R2 retries
remain independent, and stale media finalizers cannot overwrite a later reply.

Stop calls the owned `/cancel` endpoint, immediately cancels the task, stores the latest durable
partial answer and publishes an abort. The Worker observes cancellation and aborts the SDK;
late callbacks may record incomplete usage but cannot replace the stopped answer. Approval
requests complete their current run and release the Worker slot; the signed decision is admitted
as a new run extending the same assistant message.

The provider invocation marker commits before model execution. Worker crashes after this marker
become `interrupted` with a manual retry; replay restores saved output, not an interrupted remote
model call. The queue may retry preparation before this marker, but never blindly repeats an
ambiguous, potentially paid call. Worker maintenance reconciles expired or terminated tasks and
retains conservative unknown-usage reservations. See [deployment and recovery](architecture-remediation.md).

Users can attach up to six PNG, JPEG, or WebP reference images to each message, including an
image-only message. The composer uploads them through the existing R2 flow before sending, and the
durable URLs are stored as UI message file parts. Web verifies every URL against an
upload owned by the authenticated user and Worker revalidates ownership before issuing short-lived signed reads to the model, so clients cannot inject
arbitrary external images or another user's files. The supported formats follow the
[OpenAI image-input guidance](https://developers.openai.com/api/docs/guides/images-vision).

## Configuration

The stack uses the OpenAI Responses protocol so reasoning and function tools work together.
`LLM_BASE_URL` remains configurable for gateways that implement the Responses API.

| Setting                | Where                                                 | Notes                                                                         |
| :--------------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------- |
| Feature switch         | `SITE_CONFIG.features.ai` in `src/lib/config/site.js` | Gates the nav item, page, and API route.                                      |
| `LLM_API_KEY`          | `.env`                                                | Required while the feature is enabled.                                        |
| `LLM_BASE_URL`         | `.env`                                                | Optional Responses API base URL.                                              |
| `AI_DAILY_TOKEN_LIMIT` | `.env`                                                | Rolling 24h admission allowance, default 2,000,000; reserves 400,000 per run. |
| `AI_DAILY_IMAGE_LIMIT` | `.env`                                                | Rolling 24h image allowance, default 10.                                      |
| `BETTER_AUTH_SECRET`   | Web and Worker                                        | Must match so approval signatures and response handles survive handoff.       |
| `JOB_DATABASE_URL`     | Web and Worker                                        | Same existing pg-boss queue; defaults to the application database.            |
| `AI_DEFAULT_MODEL`     | `.env`                                                | Optional; defaults to `gpt-5.6-luna`.                                         |

The assistant defaults to `low` reasoning; the client may select `low`, `medium`, or `high` per
request. Image generation is intentionally fixed in code to GPT Image 2, low quality, WebP output,
and at most one built-in tool call per model response. The latest user request selects one of the
application's 1K presets: `1024x1024`, `1536x1024`, or `1024x1536`; unsupported dimensions are
mapped to the closest orientation instead of widening the output limit. These presets follow the
[official GPT Image 2 size guidance](https://developers.openai.com/api/docs/guides/image-generation#size-and-quality-options).
A custom gateway must support both the Responses protocol and the OpenAI image-generation built-in
tool for that feature to work.

To use another vendor, change `src/lib/ai/models.node.ts` only — for example install
`@ai-sdk/anthropic` and swap `createOpenAI` for `createAnthropic`. Tools, skills, agents, and
routes remain provider-agnostic.

Mutating tools must be idempotent using the authenticated user, conversation ID, and SDK
`toolCallId`. Approval signatures establish consent, not exactly-once execution. Uploads
disabled means both document storage and image generation are unavailable.

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

Show the user what a write tool produced. `ToolCallRow` renders `saveDocument`'s output as a link
to the stored file; without that the transcript reads "Used saveDocument" and the user who just
granted permission cannot tell where the file went. Because business failures arrive on the same
`output-available` state, `readSavedDocument` checks the shape instead of assuming it.

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

Agents are run-scoped `ToolLoopAgent` instances composed from skills:

```ts
// src/lib/ai/agents/support.ts
export function createSupportAgent(
  context: AgentContext,
  options: CreateAgentOptions,
  dependencies: AgentDependencies,
) {
  const { instructions, toolNames } = composeSkills([
    agentSkills.accountSupport,
    agentSkills.invoicing,
  ]);
  return new ToolLoopAgent(
    withToolApprovalSecret(
      {
        model: dependencies.models.getChatModel(),
        maxRetries: 0,
        reasoning: options.reasoningEffort,
        instructions: `You are the support agent. ...\n\n${instructions}`,
        tools: buildTools(toolNames, context, dependencies),
        stopWhen: isStepCount(AI_MAX_STEPS),
      },
      context,
      dependencies.approvalSecret,
    ),
  );
}
```

Add the factory to `agentFactories` in `src/lib/ai/agents/index.ts`; the chat route then accepts
`{ "agentId": "support" }` in the request body (default is `assistant`).

## The chat API

`POST /api/chat` expects one new UI message or approval decision, `conversationId`, UUID `requestId`, and the last persisted `parentMessageId`. The dashboard durable transport prepares this payload:

- Session cookie auth; `401` without a signed-in user.
- Rate limited per user (30 requests / 10 minutes, `ai_chat` scope).
- Body capped at 512 KB and 80 messages.
- Requires a user-owned `conversationId`; another user's or a missing conversation returns `404`.
- Accepts only `low`, `medium`, or `high` reasoning effort and defaults to `low`.
- Accepts at most six PNG, JPEG, or WebP reference images per user message and verifies each
  image against the authenticated user's upload records.
- Returns `202` JSON `{ id, runId, conversationId, assistantMessageId, status }`.
- Unusable payloads return `400`; changed history or concurrent admission returns `409`; budget exhaustion returns `429`.
- Owned `GET /api/ai/runs/{runId}` exposes state; `/stream?cursor=N` replays events; `POST /cancel` stops execution. Missing or another user’s run returns `404`.
- Provider failures are logged inside Worker and exposed as controlled stream codes, without upstream details.

`AgentContext` is rebuilt from the current database profile and owned conversation inside Worker, so no field a client sends can widen
what a tool may read.

Successful turns expose a signed, user-bound response handle in message metadata. On the next
turn the client sends one new message and the server derives and verifies the chain from stored
history before using Responses API `previous_response_id`. Clients cannot chain to another user's
response. Provider response storage is enabled because native response chaining requires it.
Approval continuations extend their existing assistant ID; ordinary turns receive a stable new ID. Explicit Retry/regenerate sends only
`{ conversationId, requestId, retryRunId }`: the server requires the latest owned terminal run
and derives its original message, approvals and options from the accepted snapshot. A changed
conversation rejects with `409`; an explicit retry may incur a new provider charge. The state
endpoint supplies `retryMessage` to restore the SDK continuation state, and conversation detail
includes `latestRun` so failure and Retry survive refresh. Legacy runs without an accepted
snapshot can be followed by a new user message but cannot reconstruct a signed approval retry.

The dashboard page at `/dashboard/ai` follows the AI Elements conversation, reasoning,
prompt-input, tool-status, and artifact patterns while reusing this repository's shadcn primitives
and design tokens. Wide desktop layouts add persistent history beside the split Chat + Canvas
workspace; narrower screens open history and Canvas in independent full-height sheets.

## Usage accounting

Every reported assistant attempt writes one `ai_usage_events` row, including aborted attempts:
user, conversation, message, agent, model, reasoning effort, language token counts, finish reason,
duration, abort/completeness flags, and independent image accounting. Aggregate by user or
conversation, not by message: approval continuations and regeneration can reuse a message ID.

`createAiUsageCollector` reads `finish-step` usage incrementally and uses `finish.totalUsage`
once if it arrives. An abort can therefore retain completed-step usage without inventing tokens
for the interrupted step. `usageComplete=false` means a lower bound, not the final bill; the run
retains its conservative token and image reservations. Missing token fields remain NULL.
`model` is the final completed step's model, accurate while a single model serves the loop.
Usage values never travel in `messageMetadata` to the client.

The pinned `@ai-sdk/openai` image tool output exposes only `{ result }`, not separate image usage.
`imageAttempts` and `generatedImages` count new tool calls, excluding earlier calls in an approval
continuation. `estimatedImageOutputCostMicrousd` estimates successful GPT Image 2 / low / WebP
output at $0.006 for 1024x1024 and $0.005 for either 1K rectangle, using the
[official image cost table](https://developers.openai.com/api/docs/guides/image-generation#calculating-costs)
verified 2026-10-01. `imageCostBasis` snapshots that assumption. This is output cost only: input
text/images, uncertain attempts, cache behavior, and gateway markups remain outside the estimate.
Do not use the estimate as an invoice. Historical image fields remain NULL; no fabricated backfill.

Reply persistence stores the accounting payload on `ai_runs` with `accountingStatus=pending`.
A second transaction inserts the usage event with a unique `runId` and marks it recorded.
A failure increments `accountingFailures`, schedules a retry after one minute, and leaves the
reply intact. Worker maintenance retries due rows in batches of 20, independently of R2 availability.
If the database also rejects the failure counter, the structured
`ai-accounting/failure_counter_unavailable` log is the remaining signal.

The Worker emits `ai-accounting/health` once per minute: all pending rows and
`oldestPendingAgeSeconds`, cumulative `failuresTotal`, and
`unreportedLast24Hours` / `partialUsageLast24Hours` for runs created in the trailing
24 hours. Pending backlog remains visible even when older than that window.
Alert on growing pending count/age or write failures. Unreported terminal runs identify requests
that ended without a usable accounting payload, including process death; they retain reservations.
Counters are queryable even after recovery:

```sql
SELECT "accountingStatus", count(*) AS runs, sum("accountingFailures") AS failures
FROM ai_runs
WHERE "createdAt" >= now() - interval '24 hours'
GROUP BY "accountingStatus";
```

Admission uses a user-scoped PostgreSQL transaction lock plus partial unique indexes for both
user and conversation queued/running runs. Execution timeout starts when Worker claims the run,
so queue waiting does not consume model runtime. Completion and cleanup affect only that run ID;
a former owner cannot write a response or release its successor. Run IDs and cursor streams are
owned resources; browser disconnection is separate from explicit cancellation.

## Testing

Agent code is unit-testable with Jest. The AI SDK packages are ESM-only, so they are listed in
`transpilePackages` in `next.config.ts` (which `next/jest` also uses), and `jest.setup.ts`
polyfills `TransformStream` for jsdom.

Patterns to copy: call a tool's `execute` directly (`tools/*.test.ts`), compose skills without a
context (`skills/compose.test.ts`), and cover admission by mocking session, rate limit, and the repository
(`src/app/api/chat/route.test.ts`). `e2e/ai-assistant.spec.ts` covers the page and the route's
rejection paths. `e2e/ai-durable-run.spec.ts` runs a local deterministic Responses-compatible server
and real bundled Worker to exercise close-tab completion, refresh, Web restart, Stop, crash and
manual retry without paid calls. `pnpm test:jobs:integration` exercises real SDK chunk consumption,
PostgreSQL transactions, cursors, media recovery and approval ownership against a dedicated test
database.
