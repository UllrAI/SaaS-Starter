# CI runner policy

GitHub-hosted Ubuntu 24.04 is the default for Quality and production release jobs.
PVE is available as an opt-in once the runner and ref protections pass acceptance.
Every pull request stays on GitHub-hosted Ubuntu.

| Repository variable | Jobs                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `PVE_BUILDS=true`   | Quality on a protected default-branch push and image builds from a protected release tag |
| `PVE_DEPLOY=true`   | Release promotion and Coolify deployment from a protected release tag                    |
| `PVE_RUNNER_LABELS` | Nonempty JSON array of labels for this repository's isolated runner                      |

Use the matching runner's `self-hosted`, `linux`, `x64`, `pve-101` and
repository-specific labels. Set the label array before setting either switch.
A missing switch, missing labels, or unprotected ref uses GitHub-hosted Ubuntu.
Releasing still requires the existing `release/vX.Y.Z` tag, exact-commit Quality
check and tested images.

## Acceptance before enabling PVE

1. Define enforced rules for the default branch and the `release/v*` tags.
   Restrict release-tag creation and updates to trusted release operators.
2. This is a public repository. Verify at GitHub's runner access boundary that
   only approved workflow paths and trusted refs can request the runner, including
   the reusable deployment workflow. The conditions in these workflow files
   cannot restrict other workflow definitions. Use a workflow-restricted runner
   group with access limited to this repository and GitHub-enforced workflow refs.
   Keep the switches unset if this restriction is unavailable.
3. Use disposable, repository-isolated PVE workers. Verify exact labels, online
   status, tools, Docker service containers, fixed test ports, host networking
   and workspace cleanup. Provision Playwright OS dependencies before Quality
   runs. Do not give the runner account broad sudo or access to other projects.
4. Test the full workflow with disposable databases and fixtures. Verify image
   permissions and the tested image references end to end before allowing access
   to production dependencies or credentials. Enable build and deploy separately
   after each passes acceptance.

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
