# CI runner policy

Pull requests and production releases for SaaS-Starter use GitHub-hosted
Ubuntu 24.04. Quality on `main` pushes uses PVE VM 101.

| Opt-in variable           | Labels variable             | Jobs                                                                     |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `PVE_BUILDS=true`         | `PVE_RUNNER_LABELS`         | Quality on default-branch pushes                                         |
| `PVE_RELEASE_BUILDS=true` | `PVE_RELEASE_RUNNER_LABELS` | Image build and publication on protected release-tag pushes              |
| `PVE_DEPLOY=true`         | `PVE_DEPLOY_RUNNER_LABELS`  | Release promotion and Coolify deployment on protected release-tag pushes |

Each labels variable is a nonempty JSON array. Use the exact label set that
Ops confirms for the pool allowed to run this repository and job. Set the
labels before enabling the matching switch. A generic host label such as
`pve-101` cannot scope a job to an owner or serve as an access policy.
Missing switches or labels keep jobs on GitHub-hosted Ubuntu. Release jobs also
use GitHub-hosted Ubuntu when the tag is unprotected.
Releasing still requires the existing `release/vX.Y.Z` tag, exact-commit Quality
check and tested images.

## PVE VM 101

Ops coordinates runner registration and host capacity on the shared VM 101.
`UllrAI/SaaS-Starter` uses the UllrAI organization runner group `pve-vm101`.
The group grants access to selected repositories and allows all workflows in
those repositories. The Quality workflow routes only default-branch pushes
to PVE. `PVE_BUILDS` is enabled with labels `self-hosted`, `linux`, `x64`,
`pve-101`, and `pve-101-ullrai`. Both release opt-ins are unset.
Personal repositories use repository-scoped instances on the same VM.

Before changing runner scope, confirm repository and workflow access in GitHub,
including the fork boundary. See
[repository access](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access)
and [workflow access](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).

## Acceptance

The temporary acceptance workflow checked out
`89836b9ea339e503ca8797ada33d7067e96a30e7` on `pve-101-ullrai` for both the
[first run](https://github.com/UllrAI/SaaS-Starter/actions/runs/43601776572/attempts/1)
and the [same-SHA rerun](https://github.com/UllrAI/SaaS-Starter/actions/runs/43601776572/attempts/2).
Both ran Quality and built and smoke-tested the Web and Worker images using
disposable data. The workflow removed its local image tags after each run.
The [pull request check](https://github.com/UllrAI/SaaS-Starter/actions/runs/43601610709)
passed on GitHub-hosted Ubuntu. After merge, the
[Quality run on `main`](https://github.com/UllrAI/SaaS-Starter/actions/runs/43603507895)
checked commit `6c30a83f5e3c2905a9fafa199de63b86b3cec9a7` on `pve-101-ullrai`.

Start with Quality on reviewed `main` pushes. Verify that only the
intended workflow events and refs route to the selected pool and that fork PRs
use GitHub-hosted Ubuntu. Check the confirmed labels, shared capacity, Node, pnpm,
Docker and Buildx, Playwright OS dependencies, service networking and cleanup.
Quality uses Docker-assigned loopback ports for PostgreSQL and an OS-assigned
loopback port for Playwright. Record the SHA, runner name, run URL, and
conclusion for the first run and any same-SHA retry. Keep the release switches
unset during Quality acceptance.

Before moving release image builds, verify access for the approved reusable
workflow and trusted release refs. Check that the job token can publish the
tested images to the existing private GHCR packages. Keep production database,
migration SSH and Coolify credentials out of the image build.

Before moving promotion or deployment, verify release-tag protection and runner
access for both workflows. Exercise the release prerequisites with disposable
data. Scope production credentials to the jobs that use them and retain the
existing restricted migration SSH path. A production release still requires a
new version-matching tag and Quality on the exact reviewed commit. If billing or
policy blocks a run, check the run and deployment state before retrying. Retry a
failed deploy job only with its verified image outputs. See
[the production runbook](deployment-coolify.md).

## Monitoring and recovery

The shared CI watchdog can monitor this repository once its inventory and access
are configured. Retain any existing read-only observers until Ops verifies
coverage for this repository, external alerts for missing watchdog heartbeats,
and fault and recovery notifications. A busy online runner may queue work.
Treat API errors as unknown and alert only after repeated evidence of an
offline runner.

Keep routing variables stable during a run and its retries. Investigate failures
on the selected pool. For a Coolify deploy failure, reconcile the deployment
queue and retry only the failed deploy job, reusing its tested image outputs.
The retry count does not select a runner pool.

## Verification

Run `python3 -B -m unittest discover -s scripts -p 'test_*.py'` and
`actionlint`. Quality runs the routing test with the existing Python tests.
Completing these checks verifies the workflow definition. PVE acceptance verifies
the actual runner and GitHub access policy.
