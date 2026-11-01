# PostgreSQL 18 upgrade

This runbook prepares the existing production-only deployment to move from the
standalone business PostgreSQL 17.11 instance to shared PostgreSQL 18.6. It is a
logical restore across major versions, not an in-place image/volume replacement.
The Coolify control database is separate and must not be used or changed.
Production Web/Worker connections remain on PG17 until the coordinator explicitly
runs the final cutover. No staging environment is introduced.

## Compatibility and preparation

- Preserve UTF8, `LOCALE_PROVIDER builtin`, `BUILTIN_LOCALE 'C.UTF-8'` and the source
  collation/ctype metadata. Use `template0`; do not silently inherit the shared
  instance's libc locale. Verify `datlocprovider`, `datlocale`, `datcollate` and
  `datctype` after creation.
- Use the PostgreSQL 18.6 `pg_dump` client to read PG17 and `pg_restore` 18.6 to
  restore custom-format dumps. Never use a PG17 client to back up PG18. The disabled
  historical GitHub backup utility also pins the PG18 client. See the official
  [pg_dump compatibility rules](https://www.postgresql.org/docs/18/app-pgdump.html).
- Keep `saas_starter_prod` and its dedicated non-superuser login on the shared
  business PG18 instance. A separate `saas_starter_restore_test` database/login is
  only an isolated rehearsal; it is not staging. Application accounts get no
  create-role/create-database privileges. Revoke PUBLIC database access, map
  restored owners explicitly and test denial of other business databases.
- The source uses only `plpgsql`, without vector or RLS. A vector-capable shared
  image does not mean this database needs a vector extension. Recheck extensions,
  stored functions, generated columns, unlogged partitions, policies and source
  ownership against the actual snapshot. Check the official
  [PG18 incompatibilities](https://www.postgresql.org/docs/18/release-18.html).
- Keep each project's pool limits within the shared instance budget. PostgreSQL
  connections are separate from Docker CPU/RAM limits; count Web and Worker domain
  pools plus both pg-boss pools and temporary deployment overlap. Do not change
  global `max_connections` as part of a project restore.

## Restore rehearsal and safe application tests

Export a source `REPEATABLE READ READ ONLY` snapshot and hold its transaction while
PG18 `pg_dump --snapshot=... -Fc` reads it. Compute table counts and sorted row hashes
in the same snapshot with `SET timezone='UTC'`; restore into the initially empty
PG18 database with the matching dedicated role and compare the result. Online
sequence reads are not MVCC: record their comparison and recheck under the final
writer freeze. Preserve the protected dump and validation report outside Git.

Restore the same dump into the isolated restore-test database, compare data and
sequence state, then run the actual one-shot application and pg-boss migrations.
Do not start a Worker against a copy of real queued jobs with real provider keys.
Use the existing integration and image smoke suites against disposable PG18 data,
synthetic credentials and no production external-service actions. A read-only Web
readiness check is useful but does not replace queue/transaction/migration tests.
A newly restored populated database and a freshly migrated empty fixture must both
work; checking only one misses upgrade or bootstrap failures.

CI Quality, database integration suites, and actual Web/Worker image smoke tests
use PostgreSQL 18.6. The existing migration entry remains `pnpm db:migrate`: a
single release step applies Drizzle and pg-boss migrations. Web and Worker do not
run a competing migration at startup. Keep the current reviewed release-tag gate;
this preparation PR keeps the package version unchanged and must not be merged or
released until the coordinator is ready.

## Final coordinated cutover

1. Confirm successful rehearsal, actual-image verification and a private PG18
   backup/restore plan covering every business database. Record resource IDs,
   image digests, original runtime configuration, source dump and rollback limits
   in the operator's protected migration records, never a public repository.
2. Gracefully stop the real Worker and Web writers, drain/account for in-flight
   tasks and verify no other writer remains. Take the final consistent dump and
   restore only the SaaS target database; compare hashes, sequences, owners,
   extensions, migrations and application-account isolation again.
3. The coordinator changes only SaaS runtime `DATABASE_URL`/`JOB_DATABASE_URL`,
   the existing `saas-migrator` account's allowed forwarding destination, and
   GitHub's production database secrets and `MIGRATION_DB_PORT`. Reuse the shared
   PG18 loopback tunnel at host `127.0.0.1:5434`; the local CI port remains 55432.
   Preserve RunMQTT and other SSH Match blocks. Run `sshd -t` before reload and
   verify an independent operator login plus the restricted database forward.
4. Run the release's one-shot migration before starting application consumers.
   Start only the new target Worker, verify `worker_ready` and queue progress,
   then Web readiness and public auth/protected-route behavior. Compare the real
   container environment privately; never print connection strings or tokens.
5. Take and independently restore a fresh private PG18 backup. When every PG17
   business consumer has moved and validation passes, the coordinator stops the
   old business PG17 resource and its old dedicated loopback tunnel, retaining
   the data volume and backups. Do not stop the Coolify control database.

## Rollback boundary

Changing application image and changing database are separate operations. Prefer a
previous verified image compatible with the current PG18 schema. Once PG18 accepts
new writes, the old PG17 copy is stale: stop target writers, preserve/reconcile the
new data and verify schema compatibility before restoring old connections or
unfencing PG17. A newer-major dump is not guaranteed to restore to an older server;
do not assume PG18 → PG17 logical rollback works. Keep the untouched final PG17
snapshot and document the chosen data reconciliation method before the switch.
