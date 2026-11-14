# CI runner policy

## Status and activation gate

The PVE route is **prepared, not enabled**. No repository runner or new
credentials were registered by this change. Keep both switches unset until
a repository-scoped isolated runner has passed acceptance. The existing
GitHub-hosted route remains the default; its exhausted allowance is not a
usable failover resource. This change does not assert successful PVE builds.

- `PVE_BUILDS=true` opts trusted build/test jobs into PVE.
- `PVE_DEPLOY=true` independently opts deployment/promotion jobs into PVE.
- `PVE_RUNNER_LABELS` must be a nonempty JSON label array for this repository's
  approved runner, including `self-hosted`, `linux`, `x64`, `pve-101` and a
  repository-specific label. Never select another project's privileged runner.
- Unset/false switches or missing labels retain the existing hosted label.
- Only push/manual-dispatch on the default branch, protected `prod`, or the
  existing `release/*` tag path can opt in. All pull requests remain hosted.
  Existing trigger, release ancestry, environment approval and image gates
  remain in force; this policy does not authorize a new release.
- Retries use the same routing rules. Attempt number is not a fallback signal.
  Switches must not be changed during an active run or deployment retry.

## Required acceptance before opt-in

1. Verify repository runner registration, online status and exact label match.
   Approve any necessary registration/credential/security changes separately.
2. Use an isolated job environment with documented Node/Python/gh/Buildx and
   PostgreSQL client versions. Some existing steps assume hosted-runner tools
   or sudo; do not grant broad sudo to make them pass. Provision dependencies
   explicitly and test their use first.
3. Test service containers, rootless Docker, host networking, fixed test ports,
   smoke container names and cleanup. Persistent shared hosts are not equivalent
   to disposable hosted runners. Use job-local network/ports or disposable VM
   isolation; do not opt in while cross-project collision remains possible.
4. Run the complete workflow without production side effects against disposable
   databases, then verify the exact tested image/digest promotion path.
5. Enable build and deploy separately after their acceptance; keep application
   migrations, secrets and backup/recovery rules unchanged.

## Monitoring and recovery

No per-run cloud watcher is added. The Coolify-managed global `ci-watchdog`
checks active jobs every 120 seconds once deployed and configured. Register
this repository in its inventory; do not assume it is live just because this
file exists. Online-but-busy means queueing, not failure. Two offline samples
may raise one deduplicated incident; API errors mean unknown, not offline.

Automatic fallback is disabled. Preserve real compile/test failures. Never
blindly rerun an already-started deployment or database migration. Retry only
the failed deployment leaf using its verified producer image. A future backup
pool must be explicitly approved and selected, not inferred from run attempts.

## Verification

Run `python3 .github/tests/test_runner_routing.py` and validate workflow YAML.
These static policy checks do not replace PVE provisioning or runtime acceptance.
