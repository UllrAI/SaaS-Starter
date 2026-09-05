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

`NEXT_PUBLIC_APP_URL` is the required build argument. User uploads use a private
R2 bucket and authenticated application URLs, so no public storage origin is
compiled into the image. Follow the [private-file cutover](architecture-remediation.md#deployment-requirements)
when upgrading an existing public bucket.

## Promotion model

Configure both production Zeabur services to deploy the `prod` branch. Neither
service should deploy direct pushes to the default development branch.

Pushing a `release/vX.Y.Z` tag matching the version in `package.json` triggers
[`promote-release-to-prod.yml`](../.github/workflows/promote-release-to-prod.yml).
The workflow reads the repository's default branch from GitHub instead of
hardcoding its name, verifies that the tagged commit is reachable from that
branch, verifies successful Quality for that exact SHA, applies production migrations
once, and then moves `prod` to the tagged commit with a guarded force push.
The current default branch is `main`.

The workflow requests `contents: write` and `actions: read`; the repository's default workflow
permissions can remain read-only. Organization policies and any ruleset
protecting `prod` must still permit this workflow to update the branch.

## Reference deployment

The production binding checked for v0.1.15 is:

| Item              | Configuration                                                     |
| ----------------- | ----------------------------------------------------------------- |
| GitHub repository | `UllrAI/SaaS-Starter` (ID `1005988967`)                           |
| Zeabur project    | `SaaS-Starter` (`684d4c992091f0ee0a4c210c`)                       |
| Environment       | `production` (`684d4c994d7e8de26fcf49d9`)                         |
| Web               | `SaaS-Starter` (`685407f976c734490a6f4770`), branch `prod`        |
| Worker            | `saas-starter-worker` (`6a89be709c1441c21a54c777`), branch `prod` |
| Public origin     | `https://starter.ullrai.com`                                      |
| Database          | Zeabur `postgresql` (`6a9b9779727467881985b9ab`), PostgreSQL 17   |
| User storage      | Private R2 bucket `saas-starter` in the UllrAi account            |

Web uses the Docker entrypoint and default `node server.js`, port `web:8080`,
and HTTP readiness at `/api/ready`. Worker overrides the image arguments with
`node dist/worker/worker.mjs`, has no HTTP port or domain, and uses a 25-second
application drain timeout. Check `worker_ready`, queue metrics, and shutdown
logs to verify Worker health; Web readiness does not cover it.

The Worker requires the same four R2 credentials and upload quotas as Web.
There is no additional always-on migration service: GitHub Actions uses the
`production` environment's `PRODUCTION_DATABASE_URL` for the one-shot release
step through an SSH tunnel. Web and Worker use the same `saas_starter` database
at `postgresql.zeabur.internal:5432`; the `saas` login owns that database and is
not a PostgreSQL superuser. The database has no public port forwarding. Its
`data` volume mounts `/var/lib/postgresql/data`, with `PGDATA` below that volume.
Keep secrets in platform stores, never in these documents.

### Migration network access

The release workflow opens an SSH tunnel to the existing Zeabur server, runs
`pnpm db:migrate`, then closes the tunnel even if migrations fail. Configure the
GitHub `production` environment as follows:

| Setting                            | Value                                                                 |
| ---------------------------------- | --------------------------------------------------------------------- |
| Variable `MIGRATION_SSH_HOST`      | Zeabur server SSH host                                                |
| Variable `MIGRATION_DB_HOST`       | PostgreSQL Kubernetes Service ClusterIP on that server                |
| Secret `MIGRATION_SSH_KEY`         | Dedicated Ed25519 private key                                         |
| Secret `MIGRATION_SSH_KNOWN_HOSTS` | Server host key verified through the Zeabur administrative connection |
| Secret `PRODUCTION_DATABASE_URL`   | Database-owner URL using `127.0.0.1:55432/saas_starter`               |

Provision a `saas-migrator` SSH account on the server with public-key-only
authentication, `AllowTcpForwarding local`, `PermitOpen <database-cluster-ip>:5432`,
`ForceCommand /bin/false`, and no TTY, agent forwarding, or X11 forwarding. Its
authorized key is restricted to that same database destination. This account
cannot run shell commands or access other services. Keep PostgreSQL on the same
server as the SSH endpoint; SSH encrypts the external part of the connection.

The Service ClusterIP survives pod restarts. If the database service is deleted
and recreated, update both `MIGRATION_DB_HOST` and the SSH destination restriction.
Rotate the dedicated key by replacing the authorized key and GitHub secret
together. Do not put Zeabur account credentials or a server administration key
in GitHub Actions. Forks must provision this tunnel before their first tag release.

For a separate queue database, `PRODUCTION_JOB_DATABASE_URL` must also be reachable
from the release runner. The reference deployment uses one database, so leave
that secret unset.

For ordinary releases, the only manual Git operation after merge/Quality is
pushing the version tag. Both Zeabur Git triggers watch `prod`; do not manually
redeploy one service from `main` or override it with a static image tag. The
v0.1.15 public-to-private cutover additionally requires draining old writers
and disabling the old R2 public domain before reopening traffic.

## Database cutover and recovery

For the v0.1.15 move from Neon, stop Web and Worker writes before taking the final
`pg_dump --format=custom --no-owner --no-acl`. Restore into the new Zeabur database
with `pg_restore --no-owner --no-acl --exit-on-error`, compare every application
and queue table count, and apply committed migrations. Switch both services’
`DATABASE_URL` and Worker `JOB_DATABASE_URL` to the internal Zeabur URL before
restarting them from the released commit. Never run the two databases as active
writers simultaneously.

Retain the old database and the final dump for rollback until the new release
is verified. After new writes begin, rollback requires moving those writes back
or restoring a current backup; changing a URL to the old snapshot would lose data.
The old Neon database is not part of the runtime or release pipeline.

Zeabur automatic backups require a paid subscription on this account. Instead,
[`database-backup.yml`](../.github/workflows/database-backup.yml) runs daily at
19:17 UTC (03:17 Asia/Shanghai) and supports manual dispatch. It takes a consistent
PostgreSQL 17 custom-format dump through the same restricted tunnel and uploads
it to private R2 bucket `saas-starter-db-backups`. A bucket lifecycle rule expires
`postgresql/` backups after 30 days. No public domain or `r2.dev` access is enabled.

Set repository variable `PRODUCTION_BACKUP_ENABLED=true` and production environment
variable `R2_BACKUP_BUCKET`. Store `R2_BACKUP_ENDPOINT`, `R2_BACKUP_ACCESS_KEY_ID`,
and `R2_BACKUP_SECRET_ACCESS_KEY` as production environment secrets. Forks must
configure these settings before enabling the schedule. Check failed Actions runs
and periodically download a backup with authenticated S3 access and restore it
into a disposable database. Daily dumps provide a recovery point of up to 24 hours;
they are not point-in-time recovery.

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
5. Configure the `production` environment database secrets and network access
   from GitHub Actions, and keep `contents: write` and `actions: read`. If `prod` is protected,
   allow this workflow to update it with a force-with-lease push.

Treat `prod` as workflow-owned state: do not merge pull requests into it or push
it manually. Publish production changes only through `release/vX.Y.Z` tags.

## Release order

1. Update `package.json` to the next unused release version in a PR, revise the
   release notes, and merge only after review and green CI.
2. Wait for Quality to pass on the exact merge commit on the default branch; a
   successful PR run alone does not satisfy the release gate. Confirm both
   services still track the expected repository and `prod`, and their variables
   match `.env.example`.
3. Configure the database secret and migration tunnel settings described above.
   Set `PRODUCTION_JOB_DATABASE_URL` only when queues use another database. The
   release workflow runs `pnpm db:migrate` after Quality verification and before promotion.
4. Fetch the default branch, check out the verified merge commit, then create
   an annotated `release/vX.Y.Z` tag matching its `package.json` and push it:

   ```bash
   git tag -a release/v1.2.3 -m "Release v1.2.3"
   git push origin release/v1.2.3
   ```

5. Wait for the promotion workflow to finish migrations and move `prod`; verify
   that the tag commit and `prod` are identical.
6. Wait for both Zeabur deployments and verify each deployment reports that same
   commit SHA. Web and Worker build the same release and Dockerfile separately;
   their image digests are not expected to be identical.
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
request fails with `Failed to find Server Action`. Every build gets fresh IDs:
Next salts them with a per-build key, and its 14-day key cache is disabled
inside Docker.

Next already forces a full page load when it notices a build ID mismatch on a
navigation or on a Server Action response. A skewed action call itself is the
one case that slips through, because the 404 is thrown before any response is
parsed. The app handles that case with its error boundaries:

- `src/lib/deployment-skew.ts` recognises the router error. The missing ID never
  comes back, so `reloadPage()` is the only recovery; `reset()` would re-run the
  same stale bundle.
- `src/app/dashboard/error.tsx` offers that reload. A Server Action is awaited
  inside `startTransition` without a try/catch, and React routes the rejection
  to the nearest boundary. `useAdminTable` rethrows a skew for the same reason
  instead of showing its generic load error.
- Every Server Action call site lives under that boundary, so
  `src/app/global-error.tsx` does not special-case a skew. It catches whatever
  escapes a root layout, reads `messages/en.json` and renders its own `<html>`
  because no provider exists at that point. There is no `src/app/layout.tsx`;
  each of `(auth)`, `(pages)`, `[locale]` and `dashboard` carries its own root
  layout, so a segment-level `src/app/error.tsx` would render outside every
  provider and throw from its own fallback. Only `dashboard` has a localized
  boundary today; the other branches fall through to `global-error.tsx`.

**Do not set `deploymentId` to try to improve on that.** With the option
present, `next build` stops generating a random build ID and compares the
deployment ID instead, so anything coarser than a per-build value (the package
version, for instance) detects strictly less than the default. See
`docs/lessons-learned.md`.

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is not set here either. It doubles as the
hash salt for action IDs, so pinning it makes rebuilds of identical source keep
their IDs. Set it only when the same source is built more than once and both
builds serve traffic, and set it **at build time**: the runtime prefers the
environment variable over the key baked into the manifest, so a key injected
only into the container cannot decrypt the bound arguments of any Server Action
that closes over them.

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

The Worker finalizes pending AI media, removes tombstoned files, and cleans
abandoned uploads every five seconds. Supply its R2 credentials and upload quotas
from the same configuration as Web. The existing cleanup endpoint can also be
called on demand:

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
