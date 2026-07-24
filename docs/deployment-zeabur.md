# Zeabur deployment

This repository's production reference deployment uses a Git-backed Zeabur
service and PostgreSQL.

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

## Release order

1. Merge only a reviewed commit with green CI.
2. Confirm the service variables match `.env.example`.
3. Run `pnpm db:migrate` once against the production `DATABASE_URL`.
4. Deploy the merged commit.
5. Wait for the build and runtime deployment to reach a successful state.
6. Verify `GET /api/health` and `GET /api/ready`.
7. Inspect build and runtime logs for errors.
8. Exercise English and Simplified Chinese marketing URLs, authentication
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
