# CI runner policy

GitHub-hosted Ubuntu 24.04 is the default for Quality and production release jobs.
PVE is available as an opt-in once runner access and job checks pass acceptance.
Every pull request stays on GitHub-hosted Ubuntu.

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
For `UllrAI/SaaS-Starter`, prefer an UllrAI organization runner pool with
verified access for this public repository. If the organization route is
unavailable, Ops can evaluate a repository-scoped runner instance on VM 101.
Personal repositories use repository-scoped instances on the same VM.
Each GitHub registration has the scope of its own organization or repository.
Ops keeps the existing runner instances in service.

Registration, runner group policy, and labels for SaaS-Starter are pending Ops
verification. Until the pool passes acceptance, keep the PVE switches unset.
Confirm repository and workflow access in GitHub, including the fork boundary.
An organization API permission error leaves those controls unverified. See
[repository access](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access)
and [workflow access](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).

## Acceptance

Start with Quality on reviewed `main` pushes. Verify that only the
approved workflow and ref can reach the selected pool, and that fork PRs use
GitHub-hosted Ubuntu. Check the confirmed labels, shared capacity, Node, pnpm,
Docker and Buildx, Playwright OS dependencies, service networking and cleanup.
Quality uses Docker-assigned loopback ports for PostgreSQL and an OS-assigned
loopback port for Playwright. Record the SHA,
runner name, run URL, and conclusion for both the first run and any same-SHA
retry. Keep the release switches unset during Quality acceptance.

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
