# CI runner policy

GitHub-hosted Ubuntu 24.04 is the default for Quality and production release jobs.
PVE is available as an opt-in once the runner and ref protections pass acceptance.
Every pull request stays on GitHub-hosted Ubuntu.

| Opt-in variable           | Labels variable             | Jobs                                                                     |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `PVE_BUILDS=true`         | `PVE_RUNNER_LABELS`         | Quality on protected default-branch pushes                               |
| `PVE_RELEASE_BUILDS=true` | `PVE_RELEASE_RUNNER_LABELS` | Image build and publication on protected release-tag pushes              |
| `PVE_DEPLOY=true`         | `PVE_DEPLOY_RUNNER_LABELS`  | Release promotion and Coolify deployment on protected release-tag pushes |

Each labels variable is a nonempty JSON array. Use the labels reported by the
selected pool, such as `self-hosted`, `linux`, and `x64` plus a custom pool
label. Set its labels before its switch.
A missing switch, missing labels, or unprotected ref uses GitHub-hosted Ubuntu.
Releasing still requires the existing `release/vX.Y.Z` tag, exact-commit Quality
check and tested images.

## Runner design under review

SaaS-Starter is public and its PVE switches are unset. The shared runner design
is under review. GitHub documents repository access controls for runner groups
and workflow access controls for supported plans. Check which controls UllrAI
can use before choosing a registration model. An API permission error leaves
those controls unverified. See [repository access](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access)
and [workflow access](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).

A shared organization runner group and multiple repository-scoped runners on
one PVE host are candidates. Separate VMs, separate system accounts, rootless
Docker, and one-job guests are possible isolation measures. Select the layout
after checking the GitHub access policy, host and workspace isolation, and which
jobs can reach production. Labels select eligible runners and carry no access
policy by themselves.

## Acceptance after selecting a design

Start with Quality on reviewed, protected `main` pushes. Verify that only the
approved workflow and ref can reach the selected pool, and that fork PRs use
GitHub-hosted Ubuntu. Confirm the runner's labels, capacity, Docker and browser
dependencies, and cleanup. Quality uses Docker-assigned loopback ports for
PostgreSQL and an OS-assigned loopback port for Playwright. Record the SHA,
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
are configured. A busy online runner may queue work. Treat API errors as unknown
and alert only after repeated evidence of an offline runner.

Keep routing variables stable during a run and its retries. Investigate failures
on the selected pool. For a Coolify deploy failure, reconcile the deployment
queue and retry only the failed deploy job, reusing its tested image outputs.
The retry count does not select a runner pool.

## Verification

Run `python3 -B -m unittest discover -s scripts -p 'test_*.py'` and
`actionlint`. Quality runs the routing test with the existing Python tests.
Completing these checks verifies the workflow definition. PVE acceptance verifies
the actual runner and GitHub access policy.
