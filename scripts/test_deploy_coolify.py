import importlib.util
import io
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

spec = importlib.util.spec_from_file_location("deploy", Path(__file__).with_name("deploy-coolify.py"))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class Response(io.BytesIO):
    pass


class DeploymentTests(unittest.TestCase):
    @patch.dict("os.environ", {"COOLIFY_TOKEN": "test"})
    @patch.object(deploy.time, "sleep")
    def test_retries_transient_reads(self, sleep):
        error = HTTPError("https://example.com", 502, "temporary", {}, None)
        with patch.object(deploy, "urlopen", side_effect=[error, Response(b'{"status":"finished"}')]) as open_url:
            self.assertEqual(deploy.api("deployments/test")["status"], "finished")
            self.assertEqual(open_url.call_count, 2)

    @patch.dict("os.environ", {"COOLIFY_TOKEN": "test"})
    def test_never_repeats_uncertain_deployment(self):
        with patch.object(deploy, "urlopen", side_effect=URLError("lost response")) as open_url:
            with self.assertRaises(URLError):
                deploy.api("deploy?uuid=test", "POST", {})
            self.assertEqual(open_url.call_count, 1)

    @patch.dict("os.environ", {"COOLIFY_TOKEN": "test"})
    def test_does_not_retry_auth_failure(self):
        error = HTTPError("https://example.com", 403, "forbidden", {}, None)
        with patch.object(deploy, "urlopen", side_effect=error) as open_url:
            with self.assertRaises(HTTPError):
                deploy.api("applications/test")
            self.assertEqual(open_url.call_count, 1)

    def test_failed_deployment_cannot_pass(self):
        with patch.object(deploy, "api", return_value={"status": "failed"}):
            with self.assertRaisesRegex(RuntimeError, "failed"):
                deploy.wait_for_deployment("test")


if __name__ == "__main__":
    unittest.main()
