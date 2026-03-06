import { describe, expect, it } from "@jest/globals";

import { defineCopyCatalog } from "./copy-catalog";

describe("defineCopyCatalog", () => {
  it("returns the original entries and resolves them by id", () => {
    const entries = [
      { id: "hero", copy: "Hero copy" },
      { id: "footer", copy: "Footer copy" },
    ] as const;

    const catalog = defineCopyCatalog(entries);

    expect(catalog.entries).toBe(entries);
    expect(catalog.get("hero")).toBe(entries[0]);
    expect(catalog.get("footer")).toBe(entries[1]);
  });

  it("throws a descriptive error for missing entries", () => {
    const catalog = defineCopyCatalog([{ id: "hero", copy: "Hero copy" }] as const);

    expect(() => catalog.get("missing")).toThrow(
      'Missing copy catalog entry for "missing"',
    );
  });
});
