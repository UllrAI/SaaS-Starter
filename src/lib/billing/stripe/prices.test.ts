import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  getActiveStripePriceId,
  getProductTierByStripePriceId,
  getStripePriceIds,
  STRIPE_PRICE_IDS,
} from "./prices";

describe("Stripe price configuration", () => {
  it("configures every catalog tier in test and live namespaces", () => {
    expect(Object.keys(STRIPE_PRICE_IDS).sort()).toEqual(
      PRODUCT_TIERS.map(({ id }) => id).sort(),
    );
    for (const tier of PRODUCT_TIERS) {
      expect(getStripePriceIds(tier.id, "test_mode")).toEqual({
        oneTime: [],
        monthly: [],
        yearly: [],
      });
      expect(getStripePriceIds(tier.id, "live_mode")).toEqual({
        oneTime: [],
        monthly: [],
        yearly: [],
      });
    }
  });

  it("resolves configured price IDs only in the selected environment", () => {
    const original = STRIPE_PRICE_IDS.plus.test_mode.monthly;
    STRIPE_PRICE_IDS.plus.test_mode.monthly = ["price_test_monthly"];
    try {
      expect(
        getProductTierByStripePriceId("price_test_monthly", "test_mode")?.id,
      ).toBe("plus");
      expect(
        getProductTierByStripePriceId("price_test_monthly", "live_mode"),
      ).toBeUndefined();
    } finally {
      STRIPE_PRICE_IDS.plus.test_mode.monthly = original;
    }
  });

  it("checks out on the newest price while still resolving rotated ones", () => {
    const original = STRIPE_PRICE_IDS.plus.test_mode.monthly;
    STRIPE_PRICE_IDS.plus.test_mode.monthly = ["price_new", "price_retired"];
    try {
      expect(getActiveStripePriceId("plus", "test_mode", "monthly")).toBe(
        "price_new",
      );
      // A subscription created before the price change still renews.
      expect(
        getProductTierByStripePriceId("price_retired", "test_mode")?.id,
      ).toBe("plus");
    } finally {
      STRIPE_PRICE_IDS.plus.test_mode.monthly = original;
    }
  });

  it("ignores unknown tiers and price IDs", () => {
    expect(getStripePriceIds("unknown", "live_mode")).toBeUndefined();
    expect(
      getActiveStripePriceId("unknown", "live_mode", "monthly"),
    ).toBeUndefined();
    expect(
      getActiveStripePriceId("plus", "live_mode", "monthly"),
    ).toBeUndefined();
    expect(getProductTierByStripePriceId("")).toBeUndefined();
    expect(getProductTierByStripePriceId("price_unknown")).toBeUndefined();
  });
});
