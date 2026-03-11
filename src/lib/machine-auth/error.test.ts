import { describe, expect, it } from "@jest/globals";
import { MachineAuthError, toMachineAuthError } from "./error";

describe("toMachineAuthError", () => {
  it("preserves explicit machine auth errors", () => {
    const error = new MachineAuthError({
      code: "UNAUTHORIZED",
      message: "Denied",
      status: 401,
    });

    expect(toMachineAuthError(error)).toBe(error);
  });

  it("sanitizes generic runtime errors", () => {
    const error = toMachineAuthError(
      new Error('Failed query: insert into "device_codes"'),
    );

    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.status).toBe(500);
    expect(error.message).toBe("Authentication service unavailable.");
  });
});
