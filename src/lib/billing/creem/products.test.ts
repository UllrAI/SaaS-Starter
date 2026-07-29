import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  CREEM_PRODUCT_IDS,
  getCreemProductIds,
  getProductTierByCreemProductId,
} from "./products";

describe("Creem product configuration", () => {
  it("configures every catalog tier in separate test and live namespaces", () => {
    for (const tier of PRODUCT_TIERS) {
      expect(getCreemProductIds(tier.id, "test_mode")).toEqual({
        oneTime: "",
        monthly: "",
        yearly: "",
      });

      const liveProductIds = getCreemProductIds(tier.id, "live_mode");
      expect(liveProductIds).toBeDefined();
      for (const productId of Object.values(liveProductIds!)) {
        expect(productId).toMatch(/^prod_[A-Za-z0-9]+$/);
      }
    }

    expect(Object.keys(CREEM_PRODUCT_IDS).sort()).toEqual(
      PRODUCT_TIERS.map(({ id }) => id).sort(),
    );
  });

  it("limits product lookups to the requested environment", () => {
    const productId = getCreemProductIds("plus", "live_mode")!.monthly;

    expect(getProductTierByCreemProductId(productId, "live_mode")?.id).toBe(
      "plus",
    );
    expect(
      getProductTierByCreemProductId(productId, "test_mode"),
    ).toBeUndefined();
    expect(getProductTierByCreemProductId(productId)?.id).toBe("plus");
  });

  it("ignores unknown tiers and product ids", () => {
    expect(getCreemProductIds("unknown", "live_mode")).toBeUndefined();
    expect(getProductTierByCreemProductId("")).toBeUndefined();
    expect(getProductTierByCreemProductId("prod_unknown")).toBeUndefined();
  });
});
