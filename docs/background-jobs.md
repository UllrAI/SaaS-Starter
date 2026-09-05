# Durable background jobs

SaaS-Starter runs durable work in a separate Node process backed by PostgreSQL
and pg-boss. Web routes create and observe product state in `task_runs`; Worker
replicas claim queue records and execute typed handlers. Closing a page or
restarting the Web service does not stop accepted work.

## Runtime commands

```bash
pnpm db:migrate       # Drizzle public schema + pg-boss schema/queues
pnpm build:worker     # dist/worker/worker.mjs
pnpm worker:dev       # local TypeScript Worker with optional .env
pnpm worker:start     # production artifact
pnpm worker:smoke     # production import smoke test
```

`pnpm build` includes the Worker artifact. Production runs Web and Worker as
separate services from the same image:

```text
Web:    node server.js
Worker: node dist/worker/worker.mjs
```

## Defining and creating work

Declare workload queues with `defineJob()` and add them to
`src/lib/jobs/catalog.ts`. The Zod schema validates every claimed payload before
the handler runs. Product routes call `createBackgroundTask()` with a concrete
definition; there is no browser-facing endpoint that accepts an arbitrary queue
name. `example.process` and `POST /api/tasks/example` provide an end-to-end
reference.

Use an application idempotency key when the business operation is idempotent.
The partial unique index on `(scopeKey, kind, idempotencyKey)` resolves concurrent
requests without a check-then-insert race. Reusing the key with different input returns 409.
Task acceptance and a `task_dispatches` outbox row commit in one transaction; the Worker
retries delivery after queue or Web failures. Each scope may have at most 100 unfinished
tasks, and the example route applies a user request limit. Queue job IDs prevent duplicate queue
rows independently. `scopeKey` is `user:<id>` in V1 and is also assigned as the
pg-boss group and singleton key. `groupConcurrency` expresses tenant fairness;
the singleton queue policy closes concurrent-claim races at a limit of one. It
does not implement provider rate limits, quotas, or billing.

## State and cancellation

Product state follows these guarded transitions:

```text
queued  -> running | failed | cancelled
running -> waiting | completed | failed | cancelled
waiting -> queued | failed | cancelled
```

Every transition is a conditional `UPDATE ... WHERE status IN (...)`. Terminal
updates and stale continuations become no-ops. Retry attempts leave a task in
`running`; only the last failed attempt changes it to `failed`.

Authenticated clients poll `GET /api/tasks/:id` and cancel with
`POST /api/tasks/:id/cancel`. Both routes scope the query to the current user and
never expose raw pg-boss records.

At each meaningful handler boundary, check `context.isCancelled()`. Persist
progress only for useful steps, not tokens or tight polling loops. For providers
that take minutes, call `context.scheduleContinuation(payload, startAfter)`
after submitting. It atomically moves the task to `waiting` and writes a delayed dispatch intent, then
lets the current handler finish so the Worker slot is released. Provider
webhooks can call `enqueueBackgroundTaskContinuation()` with a stable provider
event UUID to deduplicate the same typed continuation without polling in a
handler.

## External provider idempotency

Call `context.submitProviderJob()` for paid submissions. It passes the stable
task ID as the provider idempotency key, reuses a persisted `providerJobId`, and
stores the accepted provider job ID with a guarded update. A provider must
support idempotency or lookup by that key to close the crash window between
remote acceptance and local persistence.

## Operations and tests

Worker logs are structured JSON and include the job name, task ID, scope,
attempt, retry limit, and structured error. Logs report queue backlog and oldest pending age every minute. A periodic reconciler
repairs product state after queue retry exhaustion or supervisor termination. SIGTERM stops new claims, drains active handlers within
`WORKER_GRACEFUL_TIMEOUT_MS`, closes pg-boss and the application database, then
exits.

Run real PostgreSQL integration coverage only against a dedicated database:

```bash
JOBS_TEST_DATABASE_URL=postgresql://localhost/starter_test \
  pnpm test:jobs:integration
```

The runner rejects database names without an `e2e` or `test` segment. It covers
migration, queue/app deduplication, retry and terminal failure, two Worker
replicas, scope concurrency, cancellation races, stale continuations, and the
provider-accepted-before-crash recovery path.
