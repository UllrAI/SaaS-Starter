"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";

/**
 * A Server Action ID is a build artifact baked into the client bundle. Once a
 * new build is deployed, a page still running the previous one calls IDs the
 * server no longer knows: it answers 404 with `x-nextjs-action-not-found` and
 * the router throws an `UnrecognizedActionError`. The old ID never comes back,
 * so retrying is pointless — only a reload can recover.
 */
export function isDeploymentSkewError(error: unknown): boolean {
  return unstable_isUnrecognizedActionError(error);
}

/**
 * The only recovery from a skew. `reset()` on an error boundary re-runs the
 * same stale bundle, so every skew path funnels through a real page load.
 */
export function reloadPage(): void {
  window.location.reload();
}
