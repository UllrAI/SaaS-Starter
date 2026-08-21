import { describe, expect, it } from "@jest/globals";
import { artifactSchema } from "./artifacts";

describe("artifactSchema", () => {
  it("accepts HTTPS media and rejects executable URL schemes", () => {
    expect(
      artifactSchema.safeParse({
        kind: "video",
        title: "Demo",
        url: "https://cdn.example.com/demo.mp4",
      }).success,
    ).toBe(true);
    expect(
      artifactSchema.safeParse({
        kind: "image",
        title: "Unsafe",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});
