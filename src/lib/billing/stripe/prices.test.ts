import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  getActiveStripePriceId,
  getProductTierByStripeProductId,
  getStripeCatalogItem,
  STRIPE_CATALOG,
} from "./prices";

describe("Stripe price configuration", () => {
  it("configures every catalog tier in test and live namespaces", () => {
    expect(Object.keys(STRIPE_CATALOG).sort()).toEqual(
      PRODUCT_TIERS.map(({ id }) => id).sort(),
    );
    for (const tier of PRODUCT_TIERS) {
      expect(getStripeCatalogItem(tier.id, "test_mode")).toEqual({
        productId: "",
        oneTime: "",
        monthly: "",
        yearly: "",
      });
      expect(getStripeCatalogItem(tier.id, "live_mode")).toEqual({
        productId: "",
        oneTime: "",
        monthly: "",
        yearly: "",
      });
    }
  });

  it("resolves configured products only in the selected environment", () => {
    const original = STRIPE_CATALOG.plus.test_mode.productId;
    STRIPE_CATALOG.plus.test_mode.productId = "prod_test_plus";
    try {
      expect(
        getProductTierByStripeProductId("prod_test_plus", "test_mode")?.id,
      ).toBe("plus");
      expect(
        getProductTierByStripeProductId("prod_test_plus", "live_mode"),
      ).toBeUndefined();
    } finally {
      STRIPE_CATALOG.plus.test_mode.productId = original;
    }
  });

  it("uses the single active checkout price independently of product identity", () => {
    const original = STRIPE_CATALOG.plus.test_mode.monthly;
    STRIPE_CATALOG.plus.test_mode.monthly = "price_new";
    try {
      expect(getActiveStripePriceId("plus", "test_mode", "monthly")).toBe(
        "price_new",
      );
    } finally {
      STRIPE_CATALOG.plus.test_mode.monthly = original;
    }
  });

  it("ignores unknown tiers and product IDs", () => {
    expect(getStripeCatalogItem("unknown", "live_mode")).toBeUndefined();
    expect(
      getActiveStripePriceId("unknown", "live_mode", "monthly"),
    ).toBeUndefined();
    expect(
      getActiveStripePriceId("plus", "live_mode", "monthly"),
    ).toBeUndefined();
    expect(getProductTierByStripeProductId("")).toBeUndefined();
    expect(getProductTierByStripeProductId("prod_unknown")).toBeUndefined();
  });
});
