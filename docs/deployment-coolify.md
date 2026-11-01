# Coolify deployment

Coolify runs Web and Worker from private GHCR images. GitHub Actions performs
the build and tests; the application server only pulls and starts those images.
The existing Traefik proxy manages HTTPS. Cloudflare DNS remains proxied.

## Environments

| Setting               | Production                                   | Staging                              |
| --------------------- | -------------------------------------------- | ------------------------------------ |
| URL                   | `https://starter.ullrai.com`                 | `https://starter-staging.ullrai.com` |
| Release               | `release/vX.Y.Z`, then workflow-owned `prod` | Successful Quality on `main`         |
| Database and login    | `saas_starter_prod`                          | `saas_starter_staging`               |
| Private upload bucket | `saas-starter`                               | `saas-starter-staging`               |

The Coolify project is `SaaS-Starter`, with `production` and `staging`
environments. Each contains `saas-starter` and `saas-starter-worker`. Secrets
are shared only at the environment scope and explicitly referenced by each
consumer. Staging starts with an empty schema, has its own session and cleanup
secrets, omits production OAuth and analytics, and returns `noindex` headers.
Existing external provider credentials are reused with the owner's authorization;
Stripe remains in its existing **test mode**, including production. This does
not create separate Stripe sandboxes or separate provider billing accounts.
Do not run destructive external integration tests against shared providers.

Web listens on 3000 as UID 1001; readiness is `/api/ready`. Worker uses
`node dist/worker/worker.mjs`, has no public domain, and drains before replacement.
Both services use the same runtime layers; Worker changes only the image CMD.
Allow 40 seconds for shutdown. Check `worker_ready` and queue progress separately
from Web health. Runtime image limits are 768 MiB for Web and 512 MiB for Worker.

## CI/CD

1. PR Quality runs formatting, lint, type checks, unit/integration tests and
   Playwright against a disposable test database. Fork PRs have no deployment secrets.
2. A successful default-branch push calls `deploy-coolify.yml` for staging.
   It builds environment-specific Web/Worker images, migrates a disposable PG17
   database, and tests the actual images for database readiness, worker startup
   and non-root execution before publishing them.
3. It applies committed staging migrations once through the restricted SSH tunnel,
   updates the saved Coolify image references, deploys both services, and waits
   for deployment completion and public readiness.
4. A version-matching `release/vX.Y.Z` tag verifies successful Quality for that
   exact default-branch commit, applies production migrations once, advances
   `prod` with force-with-lease, then calls the same image/deployment workflow
   for production. Never push or merge directly into `prod`.

Image references are `ghcr.io/ullrai/saas-starter:<environment>-sha-<full-sha>`
and `ghcr.io/ullrai/saas-starter-worker:<environment>-sha-<full-sha>`. Packages
must remain Private. Actions pushes with its short-lived `GITHUB_TOKEN`; the
server reuses its existing read-only GHCR login. Next.js compiles the public
origin and analytics settings into its bundle, so production and staging require
separate builds. The Worker target reuses each completed Web build. Existing
Playwright builds use a disposable test origin and cannot substitute for these
deployment builds. Reuse reduces duplicate work; private repository builds still
consume the organization's Actions allowance.

Both GitHub environments already have `APP_URL`, `COOLIFY_WEB_UUID`,
`COOLIFY_WORKER_UUID`, `MIGRATION_SSH_HOST`, `MIGRATION_DB_HOST`,
`MIGRATION_DB_PORT` variables and `COOLIFY_TOKEN`, `MIGRATION_SSH_KEY`,
`MIGRATION_SSH_KNOWN_HOSTS`, `PRODUCTION_DATABASE_URL` secrets. The latter retains
its historical name in staging but points only to the staging database. Production
also has the three public Umami variables. Normal releases reuse these settings.
Rotate credentials only when needed; never commit them or repeat authentication
setup for each release. Keep source-triggered Coolify builds disabled.

Deployment POSTs are sent once. Read-only status requests retry transient network
and 429/5xx failures. An uncertain POST result requires checking the deployment
queue before retrying. CI reports success only after both deployments finish and
the public readiness endpoint responds.

## Database and backups

`Infrastructure / production / postgres-17` is a separate PostgreSQL 17.11
business resource, not Coolify's internal database. It has a 1 GiB memory limit.
Compatible future projects reuse this instance with separate databases and roles.
Both SaaS databases preserve UTF8 and builtin `C.UTF-8` locale. Their owners have
no superuser, create-role or create-database privileges. PUBLIC cannot connect;
cross-environment connections are explicitly denied. This is logical isolation,
not a separate failure or resource boundary.

PostgreSQL has no public port. `postgres-ci-tunnel` exposes only host loopback
`127.0.0.1:5433`, forwarding to the stable Docker DNS name of the database.
The `saas-migrator` SSH account permits only a local TCP forward to that endpoint:
no shell, TTY, agent or X11 forwarding. The verified host key is pinned in GitHub.
CI forwards local 55432 through SSH and closes it after the one-shot migration.
Docker container IP changes do not require changing CI or SSH restrictions.

Coolify backs up both named databases daily at 19:17 UTC to the existing private
`coolify-backups` R2 storage, retaining 7 local and 30 remote daily backups.
When adding another database, extend this schedule's database list and verify a
restore. Do not back up only the default `postgres` database. The old per-project
GitHub backup schedule remains disabled to avoid duplicate backup systems.
Daily logical dumps have an RPO of up to 24 hours; they do not provide PITR.

Before cutover, restore a source custom-format dump and compare all application
and queue tables, sequence state, extensions and ownership. Final cutover stops
both old writers, takes a final dump, restores it as the new owner, verifies data,
then starts only the new Web/Worker and changes DNS. Keep old Zeabur resources
suspended and the final dump until recovery is no longer needed. They are not
automatically deleted. After target writes begin, switching to the old snapshot
would lose data; restore or reconcile current target data before reverting.

For rollback, use a previously verified SHA image for **both** services and check
schema compatibility first. Database rollback is separate from image rollback.
Periodically restore an R2 backup into a disposable database and verify it before
calling the backup healthy. Do not restore over another project's database.
