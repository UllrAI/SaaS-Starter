# Zeabur deployment

This repository's production reference deployment uses a Git-backed Zeabur
Web service, Worker service, and PostgreSQL.

> **Save 10% on a Zeabur server:** Purchase a server at
> [Zeabur](https://zeabur.com/) and enter referral code `visoar` at checkout.

Zeabur is configured through `zbpack.json` to build `docker/Dockerfile`. Keep
that file in place: the multi-stage image serves only the prepared Next.js
standalone output instead of shipping the build toolchain and development
dependencies in the Web runtime.

The runtime entrypoint also drops to the unprivileged `nextjs` user when a
hosting security context starts the container as root. Verify PID 1 after
deployment instead of assuming the Dockerfile `USER` directive was preserved.

Both `NEXT_PUBLIC_APP_URL` and `R2_PUBLIC_URL` are required build arguments.
Zeabur injects their service-variable values into the multi-stage Docker build;
the build fails closed when either value is missing.

## Promotion model

Configure the production Zeabur service to deploy the `prod` branch. It must not
deploy direct pushes to the default development branch.

Pushing a `release/vX.Y.Z` tag matching the version in `package.json` triggers
[`promote-release-to-prod.yml`](../.github/workflows/promote-release-to-prod.yml).
The workflow reads the repository's default branch from GitHub instead of
hardcoding its name, verifies that the tagged commit is reachable from that
branch, and then moves `prod` to the tagged commit with a guarded force push.
The current default branch is `main`.

The workflow requests only `contents: write`; the repository's default workflow
permissions can remain read-only. Organization policies and any ruleset
protecting `prod` must still permit this workflow to update the branch.

## Using the workflow in a fork

Forks can use the same release model without assuming that the default branch is
named `main` or `master`:

1. Keep `.github/workflows/promote-release-to-prod.yml` in the fork. It reads
   the default branch name from the GitHub event at runtime.
2. Create `prod` from a reviewed default-branch commit:

   ```bash
   default_branch="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')"
   git fetch origin "${default_branch}"
   git push origin "origin/${default_branch}:refs/heads/prod"
   ```

3. Configure the production Zeabur service's Git source to watch `prod`.
4. Keep regular development and CI on the default branch. If the fork renames
   that branch, update the branch filter in `.github/workflows/quality.yml`;
   the promotion workflow itself needs no change.
5. Keep the workflow's `contents: write` permission. If `prod` is protected,
   allow this workflow to update it with a force-with-lease push.

Treat `prod` as workflow-owned state: do not merge pull requests into it or push
it manually. Publish production changes only through `release/vX.Y.Z` tags.

## Release order

1. Merge only a reviewed commit into the default branch with green CI.
2. Confirm the service variables match `.env.example`.
3. Run `pnpm db:migrate` once against the production `DATABASE_URL`.
4. Update the version in `package.json`, then create an annotated
   `release/vX.Y.Z` tag using the same version on that commit and push it:

   ```bash
   git tag -a release/v1.2.3 -m "Release v1.2.3"
   git push origin release/v1.2.3
   ```

5. Wait for the promotion workflow to move `prod`.
6. Wait for the Zeabur build and runtime deployment to succeed.
7. Verify `GET /api/health` and `GET /api/ready`.
8. Inspect build and runtime logs for errors.
9. Exercise English and Simplified Chinese marketing URLs, authentication
   redirects, and an authenticated Dashboard session.

`RATE_LIMIT_IP_HEADER` is optional and defaults to `x-forwarded-for`, the client
IP header documented by Zeabur. Override it only when another trusted ingress
uses a different supported header.

Migrations are a release step, not an application startup hook. This prevents
multiple replicas from racing on schema changes. The Web service must start
only after the migration command succeeds.

## Deployment skew

A Server Action ID is a build artifact. When a new build goes live, a browser tab
still running the previous one calls IDs the server no longer knows, and the
request fails with `Failed to find Server Action`.

The IDs are salted with the build's encryption key, which Next caches in
`.next/cache/.rscinfo` and rotates every 14 days at build time. That cache never
applies here: `getStorageDirectory` (`next/dist/server/cache-dir.js`) returns
nothing when `is-docker` matches — `/.dockerenv` exists, or `/proc/self/cgroup`
mentions docker — so **every** build gets a fresh key and fresh IDs, whether or
not the source changed.

Next catches part of this by itself. Every build gets a random build ID, and a
mismatch on a navigation turns the soft navigation into a full page load. That
only helps where a navigation happens. A Server Action response carries the
build ID too, but the client only acts on it when the action redirects — it
discards the stale flight data so the redirect becomes a full page load. Paging
or searching an admin table redirects nowhere, and a skew fails at the 404
before any of this is read, so the recovery path below is what covers it.

**Do not set `deploymentId` to try to improve on that.** As soon as that option
is present, `next build` stops generating a random build ID and hardcodes a
constant (`getBuildId` in `next/dist/build/index.js`), then compares the
deployment ID instead. Feeding it anything coarser than a per-build value — the
package version, for instance — detects strictly less than the default already
does: a rebuild of an unchanged version produces new Server Action IDs but an
unchanged deployment ID, and nothing fires.

What the app adds is the recovery path for the calls that still slip through:

- `src/lib/deployment-skew.ts` recognises the router error, and `reloadPage()`
  is the only recovery — the missing ID never comes back, so retrying cannot
  work.
- `useDeploymentSkewGuard` (`src/hooks/use-deployment-skew.ts`) wraps a Server
  Action call and turns a skew into a toast asking for a reload. Callers inside
  a dialog pass `onSkew` to close it first: Radix traps focus and hides
  everything outside the dialog from assistive tech, which would leave the
  prompt unreachable.
- `src/app/dashboard/error.tsx` offers a reload rather than `reset()`, which
  would re-run the same stale bundle. React routes a rejected `useTransition`
  callback to the nearest error boundary, so a Server Action call in the
  dashboard that forgets the guard lands there. It sits below the dashboard root
  layout on purpose, where the intl provider and the document chrome still
  exist.
- `src/app/global-error.tsx` catches whatever escapes a root layout. It reads
  `messages/en.json` and renders its own `<html>`, because at that point there
  is no provider and no document left. This repository has no
  `src/app/layout.tsx`; four branches carry their own root layout instead
  (`(auth)`, `(pages)`, `[locale]` and `dashboard`), so a segment-level
  `src/app/error.tsx` would sit above all of them, render without
  the provider its translations need, and throw from its own fallback. React
  hands the fallback's error to the next boundary up, which would replace the
  original failure with that one; the file was removed rather than left in that
  state.

### Server Function encryption key

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is worth knowing about even though this
repository does not set it. The key doubles as the hash salt for Server Action
IDs, on the Turbopack build this repository uses as much as on the webpack one,
so pinning it makes two builds of identical source produce identical action IDs
— which removes skew entirely for rebuilds that do not change the code.

Left unset, the key is generated per build and baked into the artifact. Replicas
of one image therefore already agree, so multi-instance deployments do not need
it on their own. Set it when the same source is built more than once and both
builds serve traffic, or when you want a rebuild to stay compatible with tabs
opened against the previous one.

## Durable Worker service

Create a second Zeabur service from the same repository, release, and
`docker/Dockerfile` as the Web service. Override only its start command:

```text
node dist/worker/worker.mjs
```

Do not wrap the command in `pnpm`; Node must receive SIGTERM directly. Configure
the Worker with `DATABASE_URL`, optional `JOB_DATABASE_URL`,
`JOB_DB_POOL_SIZE`, and the credentials required by its handlers. Set the
platform stop window above `WORKER_GRACEFUL_TIMEOUT_MS` (30 seconds by default).
The Worker is a required always-on service whenever durable tasks are enabled,
but its health is intentionally independent from Web readiness.

Run `pnpm db:migrate` before starting either service. It applies committed
Drizzle migrations, installs/upgrades the separate `pgboss` schema, and creates
the declared workload queues. Web and Worker runtime connections disable schema
migration, so their database roles do not need DDL permission. Drizzle is
restricted to the `public` schema and does not manage pg-boss objects.

For connection capacity, budget the application pool plus the pg-boss pool for
every replica. A Worker with `DB_POOL_SIZE=5` and `JOB_DB_POOL_SIZE=3` consumes
up to eight connections. A Web replica uses its application pool and opens its
small pg-boss pool only after enqueueing work.

## Runtime probes

- `/api/health` is a lightweight process liveness endpoint.
- `/api/ready` verifies database connectivity with a cancellable four-second
  deadline.

Use readiness for deployment health checks. A process can be alive while its
database or schema is unavailable.

## Scheduled maintenance

Call the upload cleanup endpoint once per day:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $UPLOAD_CLEANUP_SECRET" \
  "https://yourdomain.com/api/internal/uploads/cleanup"
```

Store `UPLOAD_CLEANUP_SECRET` only in the platform secret store. Do not place it
in a public build argument or repository file. Each call drains up to five
100-intent batches. A response with `batches: 5` and `scanned: 500` means the
queue reached the per-run safety cap; schedule the endpoint more frequently
until a later response reports a partial batch. Cancelled uploads release quota
immediately, while their cleanup tombstones remain for a second object deletion
24 hours later so late signed PUTs cannot leave an orphan. With a daily
schedule, expired objects may remain until a later eligible daily run. A
tombstone that becomes eligible just after the fixed run can wait through one
additional daily cycle, while expired intents stop counting toward quota
immediately.

The repository includes an opt-in `.github/workflows/production-maintenance.yml`
schedule for hosts without a native cron facility. To enable it, set the
repository variable `PRODUCTION_MAINTENANCE_ENABLED=true`, set
`PRODUCTION_APP_URL` to the public HTTPS origin, and add the same
`UPLOAD_CLEANUP_SECRET` value as an Actions secret. Deployments that do not set
the enable flag skip the job safely.

GitHub schedules run only from the default branch and are best-effort. Scheduled
workflows are disabled by default in forks, may be delayed or dropped under
load, and are disabled after 60 days without activity in a public repository.
Confirm the workflow is enabled and monitor its latest successful run. Use a
platform or external scheduler when execution timing is an SLA. See GitHub's
[schedule event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
and
[workflow enablement guidance](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow).

## Locale and SEO checks

- An explicit `/zh-Hans/...` URL stays in Simplified Chinese.
- A supported browser or saved locale redirects an unprefixed marketing URL to
  the matching locale.
- Unsupported languages remain on canonical English URLs.
- Each public page exposes the expected canonical, `hreflang`, Open Graph,
  robots, and sitemap data.
