import { describe, expect, it } from "@jest/globals";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";

import { isDeploymentSkewError } from "./deployment-skew";

describe("isDeploymentSkewError", () => {
  it("recognizes the error the router throws for a missing Server Action", () => {
    expect(
      isDeploymentSkewError(new UnrecognizedActionError("action not found")),
    ).toBe(true);
  });

  it("ignores ordinary failures", () => {
    expect(isDeploymentSkewError(new Error("network down"))).toBe(false);
    expect(isDeploymentSkewError("action not found")).toBe(false);
    expect(isDeploymentSkewError(undefined)).toBe(false);
  });
});
