"""Static guards for staged runner routing; no credentials or network required."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

class RunnerPolicyTests(unittest.TestCase):
    def test_opt_in_routes_preserve_trust_and_retry_policy(self):
        routes = []
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            for line in path.read_text().splitlines():
                if "runs-on:" in line and "PVE_" in line:
                    routes.append(line)
                    self.assertRegex(line, r"vars\.PVE_(BUILDS|DEPLOY) == 'true'")
                    self.assertIn("vars.PVE_RUNNER_LABELS != ''", line)
                    self.assertIn("github.event_name == 'push' || github.event_name == 'workflow_dispatch'", line)
                    self.assertIn("github.event.repository.default_branch", line)
                    self.assertIn("fromJSON(vars.PVE_RUNNER_LABELS)", line)
                    self.assertNotIn("run_attempt", line)
                    self.assertRegex(line, r"\|\| 'ubuntu-[^']+' \}\}$")
        self.assertTrue(routes, "Expected staged PVE routes")

if __name__ == "__main__":
    unittest.main()
