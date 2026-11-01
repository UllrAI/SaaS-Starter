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

### Local deepmerge fix

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no
published fixed deepmerge version. Jest and React Email's HTML-to-text dependency
still resolve 4.3.1. The committed `patches/deepmerge@4.3.1.patch` excludes the
special `__proto__` key from both merge inputs in the source, CommonJS and UMD
bundles, preventing attacker-controlled prototypes on the returned objects.

`pnpm test:security-dependencies` resolves the actual packages used by both
consumers and checks poisoned targets, null-prototype targets, nested values,
and ordinary nested/array/symbol behavior. Keep the patch and regression tests
until a compatible upstream fix replaces them. Dependency installation in every
Docker stage must apply the same patch.

Package-version scanners still report this one low advisory because the package
remains 4.3.1. It is not ignored or dismissed. `pnpm audit:security` fails for any
moderate, high or critical finding, while the real-package tests verify this
documented local fix. A green audit threshold does not mean zero package advisories.
