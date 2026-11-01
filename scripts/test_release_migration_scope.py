"""Real Git comparisons and GitHub evidence checks; never connect to a database."""

import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "scope", Path(__file__).with_name("release-migration-scope.py")
)
scope = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope)


def release(run_id, sha="a" * 40):
    return {
        "id": run_id,
        "run_number": run_id,
        "head_sha": sha,
        "head_branch": "release/v0.1.21",
        "head_repository": {"full_name": "UllrAI/SaaS-Starter"},
        "event": "push",
        "path": scope.WORKFLOW,
        "status": "completed",
        "conclusion": "success",
    }


def jobs(migration="success", promotion="success"):
    return {
        "total_count": 1,
        "jobs": [
            {
                "name": "promote",
                "conclusion": "success",
                "steps": [
                    {"name": scope.MIGRATION_STEP, "conclusion": migration},
                    {"name": scope.PROMOTION_STEP, "conclusion": promotion},
                ],
            }
        ],
    }


class MigrationEvidenceTests(unittest.TestCase):
    def test_skipped_release_does_not_replace_actual_migration_baseline(self):
        with patch.object(
            scope,
            "gh_api",
            side_effect=[
                {"workflow_runs": [release(1), release(2, "b" * 40)]},
                jobs(migration="skipped"),
                jobs(),
            ],
        ):
            self.assertEqual(
                scope.successful_migration_baseline("UllrAI/SaaS-Starter"),
                ("a" * 40, 1),
            )

    def test_failed_or_unpromoted_migration_is_not_trusted(self):
        for migration, promotion in (("failure", "success"), ("success", "skipped")):
            with self.subTest(migration=migration, promotion=promotion):
                with patch.object(
                    scope,
                    "gh_api",
                    side_effect=[
                        {"workflow_runs": [release(1)]},
                        jobs(migration, promotion),
                    ],
                ):
                    self.assertTrue(scope.decide("UllrAI/SaaS-Starter")[0])

    def test_missing_incomplete_or_failed_api_evidence_requires_migration(self):
        for evidence in (
            [{"workflow_runs": []}],
            [{"workflow_runs": [release(1)]}, {"jobs": [], "total_count": 101}],
            [subprocess.CalledProcessError(1, "gh")],
            [ValueError("invalid JSON")],
            [{}],
        ):
            with self.subTest(evidence=evidence):
                with patch.object(scope, "gh_api", side_effect=evidence):
                    self.assertTrue(scope.decide("UllrAI/SaaS-Starter")[0])

    def test_force_override_never_needs_api(self):
        with patch.object(scope, "gh_api") as api:
            for value in ("true", "TRUE", "1", "mistyped-value"):
                self.assertTrue(scope.decide("UllrAI/SaaS-Starter", force=value)[0])
            api.assert_not_called()


class MigrationGitTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.old_cwd = Path.cwd()
        os.chdir(self.temp.name)
        self.addCleanup(os.chdir, self.old_cwd)
        self.git("init", "--initial-branch=main")
        self.git("config", "user.email", "ci@example.invalid")
        self.git("config", "user.name", "CI test")
        for name, value in {
            "package.json": json.dumps(
                {"version": "1.0.0", "dependencies": {"pg-boss": "12.27.0"}}
            ),
            "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
            "src/database/migrations/0001.sql": "select 1;\n",
            "scripts/migrate.ts": "// migration executor\n",
            "src/lib/jobs/catalog.ts": "// queue configuration\n",
            "src/components/button.tsx": "// UI\n",
        }.items():
            self.write(name, value)
        self.baseline = self.commit()

    def git(self, *args):
        return subprocess.check_output(
            ["git", *args], stderr=subprocess.PIPE
        ).decode().strip()

    def write(self, path, value):
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value)

    def commit(self):
        self.git("add", "--all")
        self.git("commit", "--quiet", "--allow-empty", "-m", "test")
        return self.git("rev-parse", "HEAD")

    def required(self, baseline=None):
        with patch.object(
            scope,
            "successful_migration_baseline",
            return_value=(baseline or self.baseline, 123),
        ):
            return scope.decide("UllrAI/SaaS-Starter")[0]

    def test_no_input_change_or_only_release_version_ui_docs_skips(self):
        self.assertFalse(self.required())
        self.write("package.json", '{"version":"1.0.1","dependencies":{"pg-boss":"12.27.0"}}')
        self.write("src/components/button.tsx", "// changed UI\n")
        self.write("docs/deployment.md", "Updated instructions\n")
        self.write("content/posts/hello.md", "Published content\n")
        self.commit()
        self.assertFalse(self.required())

    def test_sql_runner_queue_config_lock_dependencies_and_unknown_paths_migrate(self):
        for name in (
            "src/database/migrations/0002.sql",
            "scripts/migrate.ts",
            "scripts/with-production-database.sh",
            "src/lib/jobs/catalog.ts",
            "src/database/config.ts",
            "src/lib/config/runtime-env.mjs",
            "pnpm-lock.yaml",
            "tsconfig.json",
            ".npmrc",
            "patches/database.patch",
            "unknown/migration-input",
        ):
            with self.subTest(path=name):
                self.git("reset", "--hard", self.baseline)
                self.git("clean", "-fdq")
                self.write(name, "changed\n")
                self.commit()
                self.assertTrue(self.required())
        self.git("reset", "--hard", self.baseline)
        self.write("package.json", '{"version":"1.0.1","dependencies":{"pg-boss":"13.0.0"}}')
        self.commit()
        self.assertTrue(self.required())

    def test_real_git_rename_from_sql_into_docs_requires_migration(self):
        Path("docs").mkdir()
        self.git("mv", "src/database/migrations/0001.sql", "docs/0001.sql")
        self.commit()
        # Git really considers this a rename; scope must include the old deletion.
        self.assertTrue(self.git("diff", "--name-status", self.baseline).startswith("R100"))
        self.assertTrue(self.required())

    def test_unknown_unreachable_or_nonancestor_baseline_requires_migration(self):
        self.assertTrue(self.required("f" * 40))
        self.write("docs/later.md", "later\n")
        later = self.commit()
        self.git("reset", "--hard", self.baseline)
        self.assertTrue(self.required(later))


if __name__ == "__main__":
    unittest.main()
