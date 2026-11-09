# Security Policy

## Reporting a Vulnerability

SECURITY@ullrai.com

## Dependency maintenance

Review current package advisories before publishing dependency changes. Update
compatible fixed versions, check pinned overrides, and run the repository Quality
and image checks before releasing. Never suppress an advisory to pass a release.

Release 0.1.20 updates Next.js to 16.4.3, Better Auth to 1.7.14, sharp to 0.35.5,
proxy-addr to 2.0.8 through the updated dependency graph, and the other available
security fixes selected by the lockfile. The four previously open critical
advisories are no longer reported by `pnpm audit`.

Better Auth 1.7.3 and later retain the 1.6 account schema. This project upgrades
directly to 1.7.14: no issuer-column migration is needed. The existing database was
checked for duplicate `(providerId, accountId)` keys before release. Magic Link
tokens remain hashed; old pending links and OAuth state should be restarted after
the security upgrade. See the [official upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide).

### deepmerge in development tooling

React Email uses its upstream renderer 2.2, whose HTML-to-text dependency no
longer uses `deepmerge`. The shadcn CLI supplies build-time CSS and code generation.
Jest and shadcn still resolve `deepmerge` 4.3.1 as development dependencies.

VulnCheck [rejected CVE-2026-93753](https://www.cve.org/CVERecord?id=CVE-2026-93753)
on November 2, 2026. GitHub still lists
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
as a low-severity advisory with no fixed version. Keep the committed pnpm patch
while that advisory is active. It excludes `__proto__` from both inputs in the
source, CommonJS and UMD bundles. Docker installs must apply the same patch.

`pnpm test:security-dependencies` checks the packages resolved by Jest, the
shadcn CLI and its registry, and exercises React Email's HTML and plain-text
rendering. `pnpm audit:security` fails for any moderate, high or critical finding.
The full audit can still report the low advisory for the patched development package.
