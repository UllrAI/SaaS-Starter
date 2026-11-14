# CI runner policy

GitHub-hosted Ubuntu 24.04 is the default for Quality and production release jobs.
PVE is available as an opt-in once the runner and ref protections pass acceptance.
Every pull request stays on GitHub-hosted Ubuntu.

| Opt-in variable           | Labels variable             | Jobs                                                                     |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `PVE_BUILDS=true`         | `PVE_RUNNER_LABELS`         | Quality on protected default-branch pushes                               |
| `PVE_RELEASE_BUILDS=true` | `PVE_RELEASE_RUNNER_LABELS` | Image build and publication on protected release-tag pushes              |
| `PVE_DEPLOY=true`         | `PVE_DEPLOY_RUNNER_LABELS`  | Release promotion and Coolify deployment on protected release-tag pushes |

Each labels variable is a nonempty JSON array. Use the matching runner's
`self-hosted`, `linux`, `x64`, `pve-101` and a label unique to the repository and
job role. Set its labels before its switch.
A missing switch, missing labels, or unprotected ref uses GitHub-hosted Ubuntu.
Releasing still requires the existing `release/vX.Y.Z` tag, exact-commit Quality
check and tested images.

## Quality first

The repository is public. Its existing fork approval policy controls when
GitHub runs a fork workflow. Runner groups control which workflow and ref can
request a runner. Keep all PVE switches unset until the organization confirms
that its current plan supports the required restriction and verifies it in
GitHub. See [GitHub's runner group access documentation](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).

1. The organization owner verifies an existing group or approves a group
   dedicated to this repository with selected repository and workflow access.
   Allow only `UllrAI/SaaS-Starter/.github/workflows/quality.yml@refs/heads/main`
   for the Quality runner. Confirm this in GitHub's group policy before
   registration. The repository owner separately approves enforced protection
   on `main` with reviewed changes and the existing Quality check.
2. The PVE operator confirms capacity and provisions an Ubuntu 24.04 x64 guest
   dedicated to this role. Use a non-root service account with Docker limited
   to the disposable guest. Keep host sockets, host mounts, sudo, other
   projects' credentials and production routes outside the guest. Preinstall
   Playwright OS dependencies. Permit outbound HTTPS for GitHub Actions and the
   required package and image registries. Quality uses Docker-assigned loopback
   ports for PostgreSQL and an OS-assigned loopback port for Playwright.
3. After both owners approve registration, use a one-job runner configuration
   for that group. Keep the registration credential in the operator's control
   plane and destroy each guest after the job. For example, the Quality label
   array ends with `pve-101` and `saas-starter-quality`. Check the runner's
   group, labels and online status before setting `PVE_BUILDS`.
4. Run Quality from a reviewed `main` push. Record the SHA, runner name, run
   URL and conclusion. Verify the same SHA on a second attempt with the same
   runner pool, and verify a fork PR stays hosted. Check migration, browser
   tests and cleanup. Both release switches stay unset during this phase.

## Release jobs

- The image builder needs a separate disposable runner identity and group
  restricted to the approved reusable release workflow and trusted refs. Its
  only write credential is the job's short-lived GitHub token for the existing
  private GHCR packages. Verify the tested image references and private
  visibility. The builder has no production DB, SSH or Coolify reachability.
- Promotion and deployment need a separate disposable runner identity and
  group. Before enabling, verify that GitHub can enforce the approved ref for
  both the tag-triggered promotion workflow and the reusable deployment
  workflow. Keep `PVE_DEPLOY` unset if it cannot. The repository owner approves
  tag creation and update restrictions for `release/v*` and reviews production
  environment access. The infrastructure owner separately approves egress to
  the existing restricted migration SSH endpoint and Coolify HTTPS API.
  Continue passing the existing secrets to their respective jobs. The runner
  account must have no standing copy of those credentials and no direct route
  to PostgreSQL. See [the production runbook](deployment-coolify.md).
- Exercise the release job prerequisites with disposable data before granting
  production access. For the first production run, use a new version-matching
  release tag from a reviewed commit whose exact SHA passed Quality. Verify the
  migration decision, tested images, target SHA and readiness. If GitHub blocks
  a job for account billing or policy, reconcile the run and Coolify state,
  then use the approved PVE routes for a new reviewed release. A failed deploy
  retry is appropriate only for the existing release and verified image outputs.

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
