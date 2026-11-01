#!/usr/bin/env python3
"""Skip production migrations only with verified release evidence and unchanged inputs."""

import json
import os
import re
import subprocess
from pathlib import Path

WORKFLOW = ".github/workflows/promote-release-to-prod.yml"
MIGRATION_STEP = "Apply release migrations once before promotion"
PROMOTION_STEP = "Promote tagged commit to prod"
# The migrator loads database/config/queue modules under src/lib, not UI modules.
# Unknown paths require a migration; extend this list only after checking imports.
NON_DATABASE_PREFIXES = (
    "docs/",
    "public/",
    "content/",
    "src/app/",
    "src/components/",
    "src/hooks/",
    "src/emails/",
    "src/messages/",
    "src/i18n/",
    "styles/",
)
NON_DATABASE_FILES = {"AGENTS.md", "CLAUDE.md", "LICENSE", "SECURITY.md"}


def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.PIPE, timeout=30)


def gh_api(path):
    return json.loads(
        subprocess.check_output(
            ["gh", "api", "--method", "GET", path],
            stderr=subprocess.PIPE,
            timeout=30,
        )
    )


def successful_migration_baseline(repository):
    """Skipped migrations never advance the last actually migrated SHA."""
    runs = gh_api(
        f"repos/{repository}/actions/workflows/{Path(WORKFLOW).name}/runs"
        "?status=success&event=push&per_page=100"
    )["workflow_runs"]
    for run in sorted(runs, key=lambda item: item["run_number"], reverse=True):
        if (
            run["status"] != "completed"
            or run["conclusion"] != "success"
            or run["event"] != "push"
            or run["path"] != WORKFLOW
            or not re.fullmatch(r"release/v\d+\.\d+\.\d+", run["head_branch"])
            or run["head_repository"]["full_name"].lower() != repository.lower()
        ):
            continue
        jobs = gh_api(
            f"repos/{repository}/actions/runs/{run['id']}/jobs"
            "?filter=latest&per_page=100"
        )
        if jobs["total_count"] > len(jobs["jobs"]):
            raise ValueError("Incomplete job evidence")
        for job in jobs["jobs"]:
            if job["name"] != "promote" or job["conclusion"] != "success":
                continue
            steps = {step["name"]: step["conclusion"] for step in job["steps"]}
            if steps.get(MIGRATION_STEP) == steps.get(PROMOTION_STEP) == "success":
                sha = run["head_sha"]
                if not re.fullmatch(r"[a-f0-9]{40}", sha):
                    raise ValueError("Invalid baseline SHA")
                return sha, run["id"]
    raise ValueError("No successful production migration found in recent runs")


def migration_inputs_changed(baseline, head):
    git("cat-file", "-e", f"{baseline}^{{commit}}")
    git("merge-base", "--is-ancestor", baseline, head)
    # Disable rename detection so moving SQL/code into docs still includes deletion.
    paths = git("diff", "--no-renames", "--name-only", "-z", baseline, head).split(
        b"\0"
    )
    for raw_path in filter(None, paths):
        path = raw_path.decode("utf-8")
        if path == "package.json":
            before = json.loads(git("show", f"{baseline}:package.json"))
            after = json.loads(git("show", f"{head}:package.json"))
            # Every release bumps version; all other manifest changes stay conservative.
            before.pop("version", None)
            after.pop("version", None)
            if before != after:
                return True
        elif (
            path not in NON_DATABASE_FILES
            and not re.fullmatch(r"README[^/]*\.md", path)
            and not path.startswith(NON_DATABASE_PREFIXES)
        ):
            return True
    return False


def decide(repository, head="HEAD", force=""):
    # Any non-empty value except explicit false is conservative, including typos.
    if force.strip().lower() not in ("", "false"):
        return True, "Production FORCE_MIGRATION override", None, None
    try:
        sha, run_id = successful_migration_baseline(repository)
        changed = migration_inputs_changed(sha, head)
        return (
            changed,
            "Migration inputs changed" if changed else "Migration inputs unchanged",
            sha,
            run_id,
        )
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        # Missing/deleted history, API/permission failures and incomplete evidence run it.
        return True, "Baseline or comparison could not be verified", None, None


def main():
    required, reason, sha, run_id = decide(
        os.environ["GITHUB_REPOSITORY"], force=os.environ.get("FORCE_MIGRATION", "")
    )
    result = {"required": str(required).lower(), "reason": reason}
    print(json.dumps({**result, "baseline_sha": sha, "baseline_run": run_id}))
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"required={result['required']}\n")
    if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(summary, "a", encoding="utf-8") as output:
            output.write(f"### Production migration\n\nRequired: **{required}**. {reason}.\n")
            if sha:
                output.write(
                    f"\nLast successful migration: `{sha}`, "
                    f"[run {run_id}](https://github.com/{os.environ['GITHUB_REPOSITORY']}"
                    f"/actions/runs/{run_id}).\n"
                )


if __name__ == "__main__":
    main()
