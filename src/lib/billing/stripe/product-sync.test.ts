import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  buildStripePriceSpecs,
  updatePricesConfigSource,
} from "./product-sync";

describe("Stripe product sync", () => {
  it("builds one-time, monthly, and yearly prices for every tier", () => {
    const specs = buildStripePriceSpecs(PRODUCT_TIERS, "Starter");
    expect(specs).toHaveLength(PRODUCT_TIERS.length * 3);
    expect(specs.slice(0, 3)).toEqual([
      expect.objectContaining({
        tierId: "plus",
        variant: "oneTime",
        productName: "Starter Plus",
        lookupKey: "starter_plus_onetime",
        unitAmount: 1999,
        currency: "usd",
        recurring: undefined,
      }),
      expect.objectContaining({
        variant: "monthly",
        lookupKey: "starter_plus_monthly",
        unitAmount: 999,
        recurring: { interval: "month" },
      }),
      expect.objectContaining({
        variant: "yearly",
        lookupKey: "starter_plus_yearly",
        unitAmount: 9999,
        recurring: { interval: "year" },
      }),
    ]);
  });

  it("normalizes lookup keys deterministically", () => {
    const first = buildStripePriceSpecs(PRODUCT_TIERS, " My SaaS! ");
    const second = buildStripePriceSpecs(PRODUCT_TIERS, "My SaaS!");
    expect(first.map(({ lookupKey }) => lookupKey)).toEqual(
      second.map(({ lookupKey }) => lookupKey),
    );
    expect(first[0].lookupKey).toBe("my_saas_plus_onetime");
  });

  it("updates only the selected environment and variants", () => {
    const configPath = resolve(
      process.cwd(),
      "src/lib/billing/stripe/prices.ts",
    );
    const source = readFileSync(configPath, "utf8");
    const [oneTime, monthly] = buildStripePriceSpecs(PRODUCT_TIERS);
    const updated = updatePricesConfigSource(
      source,
      [
        { ...oneTime, priceId: "price_one_time", created: true },
        { ...monthly, priceId: "price_monthly", created: false },
      ],
      "test_mode",
    );

    expect(updated).toContain(
      'test_mode: {\n      oneTime: "price_one_time",\n      monthly: "price_monthly"',
    );
    expect(updated).toContain(
      'live_mode: {\n      oneTime: "",\n      monthly: ""',
    );
  });

  it("rejects unknown tiers in the config source", () => {
    const [spec] = buildStripePriceSpecs(PRODUCT_TIERS);
    expect(() =>
      updatePricesConfigSource(
        "export const config = {};",
        [{ ...spec, tierId: "unknown", priceId: "price_123", created: true }],
        "test_mode",
      ),
    ).toThrow('Unable to find tier "unknown"');
  });
});
