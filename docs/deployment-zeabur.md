# Zeabur deployment

This repository's production reference deployment uses a Git-backed Zeabur
service and PostgreSQL.

Zeabur is configured through `zbpack.json` to build `docker/Dockerfile`. Keep
that file in place: the multi-stage image serves only the prepared Next.js
standalone output instead of shipping the build toolchain and development
dependencies in the Web runtime.

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

Call the upload cleanup endpoint at least every five minutes:

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
24 hours later so late signed PUTs cannot leave an orphan.

## Locale and SEO checks

- An explicit `/zh-Hans/...` URL stays in Simplified Chinese.
- A supported browser or saved locale redirects an unprefixed marketing URL to
  the matching locale.
- Unsupported languages remain on canonical English URLs.
- Each public page exposes the expected canonical, `hreflang`, Open Graph,
  robots, and sitemap data.
