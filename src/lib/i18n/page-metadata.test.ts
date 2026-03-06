import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreateMetadata = jest.fn((config) => config);
jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => mockCreateMetadata(config),
}));

import { createPageMetadata } from "./page-metadata";

describe("createPageMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves component-based title, description, and keywords into strings", async () => {
    const metadata = await createPageMetadata({
      title: {
        default: () => React.createElement(React.Fragment, null, "Dashboard"),
        absolute: async () =>
          React.createElement(React.Fragment, null, "Dashboard Absolute"),
        template: "%s | App",
      },
      description: () =>
        React.createElement(
          React.Fragment,
          null,
          "Welcome ",
          React.createElement("span", null, "back"),
        ),
      keywords: [
        "starter",
        () => React.createElement(React.Fragment, null, "billing"),
      ],
    });

    expect(metadata).toMatchObject({
      title: {
        default: "Dashboard",
        absolute: "Dashboard Absolute",
        template: "%s | App",
      },
      description: "Welcome back",
      keywords: ["starter", "billing"],
    });
  });

  it("omits undefined text fragments and null title templates", async () => {
    const metadata = await createPageMetadata({
      title: {
        default: "Plain Title",
        template: null,
      },
      keywords: [async () => undefined, "auth"],
    });

    expect(metadata).toMatchObject({
      title: {
        default: "Plain Title",
      },
      keywords: ["auth"],
    });
  });

  it("supports plain string metadata without transformation loss", async () => {
    const metadata = await createPageMetadata({
      title: "Pricing",
      description: "Choose a plan",
    });

    expect(metadata).toMatchObject({
      title: "Pricing",
      description: "Choose a plan",
    });
  });
});
