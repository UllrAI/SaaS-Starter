import { describe, expect, it } from "@jest/globals";
import { parseCliArgs } from "./args";

describe("parseCliArgs", () => {
  it("ignores pnpm's separator and parses trailing options", () => {
    expect(
      parseCliArgs([
        "--",
        "auth",
        "status",
        "--base-url",
        "http://localhost:3000/",
      ]),
    ).toEqual({
      positionals: ["auth", "status"],
      baseUrl: "http://localhost:3000",
      noBrowser: false,
    });
  });

  it("supports options before subcommands", () => {
    expect(
      parseCliArgs([
        "--base-url=http://localhost:3000/",
        "auth",
        "login",
        "--no-browser",
      ]),
    ).toEqual({
      positionals: ["auth", "login"],
      baseUrl: "http://localhost:3000",
      noBrowser: true,
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseCliArgs(["auth", "status", "--wat"])).toThrow(
      "Unknown option: --wat",
    );
  });
});
