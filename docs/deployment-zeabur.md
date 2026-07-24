# Zeabur deployment

This repository's production reference deployment uses a Git-backed Zeabur
service and PostgreSQL.

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

Pushing a `release/*` tag triggers
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
it manually. Publish production changes only through `release/*` tags.

## Release order

1. Merge only a reviewed commit into the default branch with green CI.
2. Confirm the service variables match `.env.example`.
3. Run `pnpm db:migrate` once against the production `DATABASE_URL`.
4. Create an annotated `release/*` tag on that commit and push it:

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

`RATE_LIMIT_IP_HEADER` must be the single-value client-IP header overwritten by
the active Zeabur ingress. Verify the header behavior for the selected region
before release; do not assume a generic `X-Forwarded-For` value is trustworthy.

Migrations are a release step, not an application startup hook. This prevents
multiple replicas from racing on schema changes. The Web service must start
only after the migration command succeeds.

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
