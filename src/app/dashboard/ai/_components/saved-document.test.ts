import { describe, expect, it } from "@jest/globals";
import { readSavedDocument } from "./saved-document";

describe("readSavedDocument", () => {
  it("reads a successful save", () => {
    expect(
      readSavedDocument({
        fileName: "launch-plan.md",
        fileSize: 13,
        url: "https://cdn.example.com/launch-plan.md",
      }),
    ).toEqual({
      fileName: "launch-plan.md",
      fileSize: 13,
      url: "https://cdn.example.com/launch-plan.md",
    });
  });

  it("ignores a reported failure", () => {
    // The tool returns business failures as a successful output, so a quota
    // error must not render as a saved file.
    expect(
      readSavedDocument({ error: "The user's total storage quota is full." }),
    ).toBeNull();
  });

  it("rejects a URL that is not HTTP(S)", () => {
    expect(
      readSavedDocument({
        fileName: "launch-plan.md",
        fileSize: 13,
        url: "javascript:alert(1)",
      }),
    ).toBeNull();
  });

  it.each([
    ["a missing file name", { fileSize: 13, url: "https://x/y" }],
    ["an empty file name", { fileName: "", fileSize: 13, url: "https://x/y" }],
    [
      "a non-numeric size",
      { fileName: "a.md", fileSize: "13", url: "https://x/y" },
    ],
    ["a malformed URL", { fileName: "a.md", fileSize: 13, url: "not-a-url" }],
    ["a non-object output", "saved"],
  ])("returns nothing for %s", (_label, output) => {
    expect(readSavedDocument(output)).toBeNull();
  });
});
