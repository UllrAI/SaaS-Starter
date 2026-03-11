import { spawn } from "child_process";

function assertSupportedBrowserUrl(url: string): string {
  const parsedUrl = new URL(url);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Browser launch only supports http and https URLs.");
  }

  return parsedUrl.toString();
}

export function openBrowser(url: string): void {
  const targetUrl = assertSupportedBrowserUrl(url);
  const platform = process.platform;

  if (platform === "darwin") {
    spawn("open", [targetUrl], { stdio: "ignore", detached: true }).unref();
    return;
  }

  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", targetUrl], {
      stdio: "ignore",
      detached: true,
    }).unref();
    return;
  }

  spawn("xdg-open", [targetUrl], { stdio: "ignore", detached: true }).unref();
}
