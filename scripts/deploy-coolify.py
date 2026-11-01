"""Deploy immutable images once, then wait for both services and Web readiness."""

import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ORIGIN = "https://c.ullrai.com"
RETRY_STATUS = (429, 500, 502, 503, 504)


def api(path, method="GET", body=None):
    headers = {
        "Authorization": "Bearer " + os.environ["COOLIFY_TOKEN"],
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "SaaS-Starter-Deploy/1.0",
    }
    request = Request(
        ORIGIN + "/api/v1/" + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    # Only retry reads. A lost mutation response may already have taken effect.
    for attempt in range(6):
        try:
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except (URLError, TimeoutError) as error:
            if method != "GET" or attempt == 5:
                raise
            if isinstance(error, HTTPError):
                if error.code not in RETRY_STATUS:
                    raise
                error.close()
            time.sleep(5)


def wait_for_deployment(deployment_id):
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        status = api("deployments/" + deployment_id)["status"]
        if status == "finished":
            return
        if status in ("failed", "cancelled", "canceled"):
            raise RuntimeError("Coolify deployment " + status)
        time.sleep(5)
    raise TimeoutError("Coolify deployment exceeded ten minutes")


def main():
    targets = [
        (os.environ["COOLIFY_WEB_UUID"], os.environ["WEB_IMAGE"]),
        (os.environ["COOLIFY_WORKER_UUID"], os.environ["WORKER_IMAGE"]),
    ]
    for uuid, image in targets:
        name, tag = image.rsplit(":", 1)
        api("applications/" + uuid, "PATCH", {
            "docker_registry_image_name": name,
            "docker_registry_image_tag": tag,
        })
    # Drain the old worker before starting a replacement. Web rolling updates
    # remain enabled; committed schema migrations must be backward compatible.
    worker_uuid = os.environ["COOLIFY_WORKER_UUID"]
    worker = api("applications/" + worker_uuid)
    if worker.get("status", "").startswith("running"):
        api("applications/" + worker_uuid + "/stop", "POST", {})
        deadline = time.monotonic() + 90
        while api("applications/" + worker_uuid).get("status", "").startswith("running"):
            if time.monotonic() >= deadline:
                raise TimeoutError("Old worker did not stop")
            time.sleep(3)
    for uuid, _ in targets:
        result = api("deploy?uuid=" + uuid, "POST", {})
        deployments = result.get("deployments", [])
        if len(deployments) != 1 or not deployments[0].get("deployment_uuid"):
            raise RuntimeError("Expected exactly one queued deployment")
        deployment_id = deployments[0]["deployment_uuid"]
        print("Coolify deployment: " + deployment_id, flush=True)
        wait_for_deployment(deployment_id)
    app_url = os.environ["APP_URL"]
    if urlsplit(app_url).scheme != "https":
        raise ValueError("APP_URL must use HTTPS")
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        try:
            request = Request(app_url + "/api/ready", headers={"User-Agent": "SaaS-Starter-Check/1.0"})
            with urlopen(request, timeout=15) as response:
                if json.load(response).get("status") == "ready":
                    print("Both services deployed; public readiness verified")
                    return
        except (URLError, TimeoutError):
            pass
        time.sleep(5)
    raise TimeoutError("Public readiness did not become healthy")


if __name__ == "__main__":
    main()
