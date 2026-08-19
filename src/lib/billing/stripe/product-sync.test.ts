import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  buildStripePriceSpecs,
  mergePriceIdHistory,
  PRICE_ID_HISTORY_LIMIT,
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
      'test_mode: {\n      oneTime: ["price_one_time"],\n      monthly: ["price_monthly"]',
    );
    expect(updated).toContain(
      "live_mode: {\n      oneTime: [],\n      monthly: []",
    );
  });

  it("keeps rotated-out price IDs so live subscriptions still resolve", () => {
    const [oneTime] = buildStripePriceSpecs(PRODUCT_TIERS);
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/billing/stripe/prices.ts"),
      "utf8",
    );
    const first = updatePricesConfigSource(
      source,
      [{ ...oneTime, priceId: "price_old", created: true }],
      "test_mode",
    );
    const second = updatePricesConfigSource(
      first,
      [{ ...oneTime, priceId: "price_new", created: true }],
      "test_mode",
    );

    expect(second).toContain('oneTime: ["price_new", "price_old"]');
  });

  it("promotes a reused price ID instead of duplicating it", () => {
    expect(mergePriceIdHistory(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("caps the history so the config cannot grow without bound", () => {
    const existing = Array.from(
      { length: PRICE_ID_HISTORY_LIMIT },
      (_, index) => `price_${index}`,
    );
    const merged = mergePriceIdHistory(existing, "price_new");
    expect(merged).toHaveLength(PRICE_ID_HISTORY_LIMIT);
    expect(merged[0]).toBe("price_new");
    expect(merged).not.toContain(`price_${PRICE_ID_HISTORY_LIMIT - 1}`);
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
