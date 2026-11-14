"""Guard the trusted refs and explicit switches for PVE routing."""

from pathlib import Path
import re
import unittest


WORKFLOWS = Path(__file__).resolve().parents[1] / ".github/workflows"


class RunnerPolicyTests(unittest.TestCase):
    def test_pve_routes_require_opt_in_and_trusted_pushes(self):
        default_branch = (
            "github.ref == format('refs/heads/{0}', "
            "github.event.repository.default_branch)"
        )
        release_tag = (
            "github.ref_protected && startsWith(github.ref, 'refs/tags/release/v')"
        )
        expected = {
            "quality.yml": [("PVE_BUILDS", "PVE_RUNNER_LABELS", default_branch)],
            "promote-release-to-prod.yml": [
                ("PVE_DEPLOY", "PVE_DEPLOY_RUNNER_LABELS", release_tag),
            ],
            "deploy-coolify.yml": [
                ("PVE_RELEASE_BUILDS", "PVE_RELEASE_RUNNER_LABELS", release_tag),
                ("PVE_DEPLOY", "PVE_DEPLOY_RUNNER_LABELS", release_tag),
            ],
        }

        for path in sorted(WORKFLOWS.glob("*.yml")):
            with self.subTest(workflow=path.name):
                routes = [
                    " ".join(route.split())
                    for route in re.findall(
                        r"(?m)^    runs-on:([^\n]*(?:\n {6}[^\n]*)*)",
                        path.read_text(),
                    )
                    if "PVE_" in route
                ]
                trusted_routes = [
                    (
                        f">- ${{{{ vars.{switch} == 'true' && "
                        f"vars.{labels} != '' && "
                        "github.event_name == 'push' && "
                        f"{ref} && fromJSON(vars.{labels}) "
                        "|| 'ubuntu-24.04' }}"
                    )
                    for switch, labels, ref in expected.get(path.name, [])
                ]
                self.assertEqual(routes, trusted_routes)
