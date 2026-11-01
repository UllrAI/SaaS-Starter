# Coolify deployment

Coolify runs Web and Worker from private GHCR images. GitHub Actions performs
the build and tests; the application server only pulls and starts those images.
The existing Traefik proxy manages HTTPS. Cloudflare DNS remains proxied.

## Production

This project had only production on Zeabur and keeps only production on Coolify.
Do not add staging during a hosting migration unless it already exists in the
source project or the owner explicitly requests a new environment.

- Project / environment: `SaaS-Starter / production`.
- Applications: `saas-starter` and `saas-starter-worker`.
- Public origin: `https://starter.ullrai.com`.
- The temporary acceptance alias was removed after cutover, including its
  Coolify binding and Cloudflare DNS. Create future acceptance aliases only when
  needed and remove them immediately after validation. They are not staging.
- Database and login: `saas_starter_prod`.
- Private upload bucket: existing `saas-starter`.

Environment variables and existing provider credentials are migrated from Zeabur.
Shared secrets live only at the production environment scope and are explicitly
referenced by each consumer. Stripe remains in its existing **test mode**; this
migration does not change the payment mode or provider accounts. Original OAuth
callbacks remain valid because the public origin is unchanged.

Web listens on 3000 as UID 1001; readiness is `/api/ready`. Worker uses
`node dist/worker/worker.mjs`, has no public domain, and drains before replacement.
Both services use the same runtime layers; Worker changes only the image CMD.
Allow 40 seconds for shutdown. Check `worker_ready` and queue progress separately
from Web health. Runtime image limits are 768 MiB for Web and 512 MiB for Worker.

## CI/CD

1. PR Quality runs formatting, lint, type checks, unit/integration tests and
   Playwright against a disposable test database. Fork PRs have no deployment secrets.
2. A version-matching `release/vX.Y.Z` tag verifies successful Quality for that
   exact default-branch commit, applies production migrations once, and advances
   `prod` with force-with-lease. Never push or merge directly into `prod`.
3. It calls `deploy-coolify.yml`, which builds Web/Worker images, migrates a
   disposable PostgreSQL 18.6 test database, and tests the actual images for database readiness,
   worker startup and non-root execution before publishing them.
4. It updates the saved Coolify image references, drains the previous Worker,
   deploys both services, and waits for deployment completion and public readiness.

Image references are `ghcr.io/ullrai/saas-starter:production-sha-<full-sha>`
and `ghcr.io/ullrai/saas-starter-worker:production-sha-<full-sha>`. Packages
must remain Private. Actions pushes with its short-lived `GITHUB_TOKEN`; the
server reuses its existing read-only GHCR login. Next.js compiles the public
origin and analytics settings into its bundle. The Worker target reuses the
completed Web build. Existing
Playwright builds use a disposable test origin and cannot substitute for these
deployment builds. Reuse reduces duplicate work; private repository builds still
consume the organization's Actions allowance.

The GitHub production environment already has `APP_URL`, `COOLIFY_WEB_UUID`,
`COOLIFY_WORKER_UUID`, `MIGRATION_SSH_HOST`, `MIGRATION_DB_HOST`,
`MIGRATION_DB_PORT` variables and `COOLIFY_TOKEN`, `MIGRATION_SSH_KEY`,
`MIGRATION_SSH_KNOWN_HOSTS`, `PRODUCTION_DATABASE_URL` secrets. It also has the three public Umami variables. Normal releases reuse these settings.
Rotate credentials only when needed; never commit them or repeat authentication
setup for each release. Keep source-triggered Coolify builds disabled.

Deployment POSTs are sent once. Read-only status requests retry transient network
and 429/5xx failures. An uncertain POST result requires checking the deployment
queue before retrying. CI reports success only after both deployments finish and
the public readiness endpoint responds.

## Database and backups

Release `v0.1.21` targets `Infrastructure / production / postgres-18`, the
shared PostgreSQL 18.6 business resource with the verified vector-capable image.
CI, actual-image smoke tests and the logical-backup client use PostgreSQL 18.6.
Before publishing this release, complete the coordinated final restore and runtime /
CI connection switch in [the PostgreSQL 18 runbook](postgresql-18-migration.md).
Merging or passing Quality alone does not cut over the live database.

The shared resource has a 2 GiB memory / 1.5 CPU limit and an operator-managed
connection budget; do not change global settings from a project deployment.
Compatible future projects reuse it with isolated databases and roles. SaaS
preserves UTF8 and builtin `C.UTF-8`, with the original collation/ctype metadata,
and requires only `plpgsql`, not vector. Its owner has no superuser, create-role
or create-database privileges. PUBLIC cannot connect. Other projects use different
databases and roles; this is logical isolation, not a separate failure boundary.

PostgreSQL has no public port. The existing shared PG18 CI tunnel exposes only
host loopback `127.0.0.1:5434` and forwards to the database's stable Docker DNS.
The reused `saas-migrator` SSH account permits only that local TCP forward, with
no shell, TTY, agent or X11 forwarding. Keep the verified host key pinned in GitHub.
CI uses local port 55432 and closes it after the one-shot migration. The coordinator
updates the existing production URL secrets and `MIGRATION_DB_PORT` during cutover;
normal releases reuse them without creating another key/account/tunnel.

The former business `postgres-17` resource and its `127.0.0.1:5433` tunnel are
historical recovery resources after cutover, not a target for new deployments.
Fence only the old SaaS login until the operator has confirmed and cleaned every
other PG17 consumer. The operator stops the whole old instance separately while
retaining its volume and backups. Never stop the separate Coolify control database.

The shared PG18 schedule backs up `saas_starter_prod` with the other business
databases daily at 19:37 UTC to the existing private
`coolify-backups` R2 storage, retaining 7 local and 30 remote daily backups.
When adding another database, extend this schedule's database list and verify a
restore. Do not back up only the default `postgres` database. The old per-project
GitHub backup schedule remains disabled to avoid duplicate backup systems.
Daily logical dumps have an RPO of up to 24 hours; they do not provide PITR.

Before cutover, restore a source custom-format dump and compare all application
and queue tables, sequence state, extensions and ownership. Final cutover stops
both old writers, takes a final dump, restores it as the new owner, verifies data,
then starts only the new Web/Worker and changes DNS. Keep old Zeabur resources
suspended and the final dump until recovery is no longer needed. The old database
login `saas` is also fenced with `NOLOGIN` and its sessions were closed. Re-enable
that login only as part of a deliberate database rollback after reconciling target
writes and stopping the target writers. Old resources are not automatically deleted. After target writes begin, switching to the old snapshot
would lose data; restore or reconcile current target data before reverting.

For rollback, use a previously verified SHA image for **both** services and check
schema compatibility first. Database rollback is separate from image rollback.
Periodically restore an R2 backup into a disposable database and verify it before
calling the backup healthy. Do not restore over another project's database.

## Migration acceptance — 2026-11-01

Release `v0.1.19` was deployed through the gated release workflow. The final
source dump matched the restored production database across all 34 application
and queue tables and sequence state. A private R2 backup was independently
restored into a disposable database and verified. Web and Worker run as UID 1001;
Web readiness and Worker startup/queue checks passed. The public origin, both
locale pages, login/anonymous-session handling, protected-route redirect, static
JavaScript, robots and sitemap were checked after cutover. Cloudflare remains
proxied and validates the origin certificate with Full (strict).
