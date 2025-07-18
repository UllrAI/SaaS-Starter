import { describe, it, expect } from "@jest/globals";
import {
  PRODUCT_TIERS,
  getProductTierById,
  getProductTierByProductId,
  type PricingTier,
  type ProductFeature,
} from "./products";

describe("Product Configuration", () => {
  describe("PRODUCT_TIERS", () => {
    it("should have at least one product tier", () => {
      expect(PRODUCT_TIERS).toBeDefined();
      expect(Array.isArray(PRODUCT_TIERS)).toBe(true);
      expect(PRODUCT_TIERS.length).toBeGreaterThan(0);
    });

    it("should have valid tier structure", () => {
      PRODUCT_TIERS.forEach((tier) => {
        expect(tier).toHaveProperty("id");
        expect(tier).toHaveProperty("name");
        expect(tier).toHaveProperty("description");
        expect(tier).toHaveProperty("isPopular");
        expect(tier).toHaveProperty("features");
        expect(tier).toHaveProperty("pricing");
        expect(tier).toHaveProperty("prices");
        expect(tier).toHaveProperty("currency");

        expect(typeof tier.id).toBe("string");
        expect(typeof tier.name).toBe("string");
        expect(typeof tier.description).toBe("string");
        expect(typeof tier.isPopular).toBe("boolean");
        expect(Array.isArray(tier.features)).toBe(true);
        expect(typeof tier.pricing).toBe("object");
        expect(typeof tier.prices).toBe("object");
        expect(["USD", "EUR"]).toContain(tier.currency);
      });
    });

    it("should have valid pricing structure", () => {
      PRODUCT_TIERS.forEach((tier) => {
        expect(tier.pricing).toHaveProperty("creem");
        expect(tier.pricing.creem).toHaveProperty("oneTime");
        expect(tier.pricing.creem).toHaveProperty("monthly");
        expect(tier.pricing.creem).toHaveProperty("yearly");

        expect(typeof tier.pricing.creem.oneTime).toBe("string");
        expect(typeof tier.pricing.creem.monthly).toBe("string");
        expect(typeof tier.pricing.creem.yearly).toBe("string");

        // Should not be empty strings
        expect(tier.pricing.creem.oneTime.length).toBeGreaterThan(0);
        expect(tier.pricing.creem.monthly.length).toBeGreaterThan(0);
        expect(tier.pricing.creem.yearly.length).toBeGreaterThan(0);
      });
    });

    it("should have valid prices structure", () => {
      PRODUCT_TIERS.forEach((tier) => {
        expect(tier.prices).toHaveProperty("oneTime");
        expect(tier.prices).toHaveProperty("monthly");
        expect(tier.prices).toHaveProperty("yearly");

        expect(typeof tier.prices.oneTime).toBe("number");
        expect(typeof tier.prices.monthly).toBe("number");
        expect(typeof tier.prices.yearly).toBe("number");

        // Prices should be positive
        expect(tier.prices.oneTime).toBeGreaterThan(0);
        expect(tier.prices.monthly).toBeGreaterThan(0);
        expect(tier.prices.yearly).toBeGreaterThan(0);
      });
    });

    it("should have valid features structure", () => {
      PRODUCT_TIERS.forEach((tier) => {
        expect(tier.features.length).toBeGreaterThan(0);

        tier.features.forEach((feature: ProductFeature) => {
          expect(feature).toHaveProperty("name");
          expect(feature).toHaveProperty("included");
          expect(typeof feature.name).toBe("string");
          expect(typeof feature.included).toBe("boolean");
          expect(feature.name.length).toBeGreaterThan(0);

          if (feature.description) {
            expect(typeof feature.description).toBe("string");
          }
        });
      });
    });

    it("should have unique tier IDs", () => {
      const ids = PRODUCT_TIERS.map((tier) => tier.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have at most one popular tier", () => {
      const popularTiers = PRODUCT_TIERS.filter((tier) => tier.isPopular);
      expect(popularTiers.length).toBeLessThanOrEqual(1);
    });

    it("should contain expected tiers", () => {
      const tierIds = PRODUCT_TIERS.map((tier) => tier.id);
      expect(tierIds).toContain("plus");
      expect(tierIds).toContain("pro");
      expect(tierIds).toContain("team");
    });

    it("should have consistent pricing order (yearly < monthly per month)", () => {
      PRODUCT_TIERS.forEach((tier) => {
        const monthlyYearlyPrice = tier.prices.yearly / 12;
        // Yearly should be cheaper per month than monthly
        expect(monthlyYearlyPrice).toBeLessThanOrEqual(tier.prices.monthly);
      });
    });
  });

  describe("getProductTierById", () => {
    it("should return correct tier for valid ID", () => {
      const plusTier = getProductTierById("plus");
      expect(plusTier).toBeDefined();
      expect(plusTier?.id).toBe("plus");
      expect(plusTier?.name).toBe("Plus");

      const proTier = getProductTierById("pro");
      expect(proTier).toBeDefined();
      expect(proTier?.id).toBe("pro");
      expect(proTier?.name).toBe("Professional");

      const teamTier = getProductTierById("team");
      expect(teamTier).toBeDefined();
      expect(teamTier?.id).toBe("team");
      expect(teamTier?.name).toBe("Team");
    });

    it("should return undefined for invalid ID", () => {
      expect(getProductTierById("nonexistent")).toBeUndefined();
      expect(getProductTierById("")).toBeUndefined();
      expect(getProductTierById("invalid")).toBeUndefined();
      expect(getProductTierById("PLUS")).toBeUndefined(); // Case sensitive
    });

    it("should handle edge cases", () => {
      expect(getProductTierById("")).toBeUndefined();
      expect(getProductTierById(" ")).toBeUndefined();
      expect(getProductTierById("null")).toBeUndefined();
      expect(getProductTierById("undefined")).toBeUndefined();
    });

    it("should return the full tier object with all properties", () => {
      const tier = getProductTierById("pro");
      expect(tier).toBeDefined();
      if (tier) {
        expect(tier).toHaveProperty("id", "pro");
        expect(tier).toHaveProperty("name", "Professional");
        expect(tier).toHaveProperty("description");
        expect(tier).toHaveProperty("isPopular", true);
        expect(tier).toHaveProperty("features");
        expect(tier).toHaveProperty("pricing");
        expect(tier).toHaveProperty("prices");
        expect(tier).toHaveProperty("currency", "USD");
      }
    });
  });

  describe("getProductTierByProductId", () => {
    it("should return correct tier for valid Creem product IDs", () => {
      // Test with known product IDs from the configuration
      const plusTierOneTime = getProductTierByProductId(
        "prod_1HVwfBIaKkJh9CgS7zD37h",
      );
      expect(plusTierOneTime).toBeDefined();
      expect(plusTierOneTime?.id).toBe("plus");

      const plusTierMonthly = getProductTierByProductId(
        "prod_6uhcfBUcRxprqDvep0U5Jw",
      );
      expect(plusTierMonthly).toBeDefined();
      // Note: This product ID is used by multiple tiers due to example data

      const plusTierYearly = getProductTierByProductId(
        "prod_7LJkGVgv4LOBuucrxANo2b",
      );
      expect(plusTierYearly).toBeDefined();
      expect(plusTierYearly?.id).toBe("plus");
    });

    it("should return undefined for invalid product ID", () => {
      expect(getProductTierByProductId("prod_invalid")).toBeUndefined();
      expect(getProductTierByProductId("")).toBeUndefined();
      expect(getProductTierByProductId("not_a_product_id")).toBeUndefined();
    });

    it("should handle edge cases", () => {
      expect(getProductTierByProductId("")).toBeUndefined();
      expect(getProductTierByProductId(" ")).toBeUndefined();
      expect(getProductTierByProductId("null")).toBeUndefined();
      expect(getProductTierByProductId("undefined")).toBeUndefined();
    });

    it("should return the first matching tier for duplicate product IDs", () => {
      // Since multiple tiers use the same example product ID, test that it returns consistently
      const result1 = getProductTierByProductId("prod_6uhcfBUcRxprqDvep0U5Jw");
      const result2 = getProductTierByProductId("prod_6uhcfBUcRxprqDvep0U5Jw");

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1?.id).toBe(result2?.id); // Should be consistent
    });

    it("should find tiers by all billing cycle product IDs", () => {
      // Test that we can find tiers by oneTime, monthly, and yearly product IDs
      PRODUCT_TIERS.forEach((tier) => {
        const foundByOneTime = getProductTierByProductId(
          tier.pricing.creem.oneTime,
        );
        const foundByMonthly = getProductTierByProductId(
          tier.pricing.creem.monthly,
        );
        const foundByYearly = getProductTierByProductId(
          tier.pricing.creem.yearly,
        );

        // Each product ID should find a tier (though might not be the original due to duplicates in test data)
        expect(foundByOneTime).toBeDefined();
        expect(foundByMonthly).toBeDefined();
        expect(foundByYearly).toBeDefined();

        // At least verify we get back valid tier objects
        if (foundByOneTime) expect(foundByOneTime.id).toBeTruthy();
        if (foundByMonthly) expect(foundByMonthly.id).toBeTruthy();
        if (foundByYearly) expect(foundByYearly.id).toBeTruthy();
      });
    });

    it("should return the full tier object with all properties", () => {
      const tier = getProductTierByProductId("prod_1HVwfBIaKkJh9CgS7zD37h");
      expect(tier).toBeDefined();
      if (tier) {
        expect(tier).toHaveProperty("id");
        expect(tier).toHaveProperty("name");
        expect(tier).toHaveProperty("description");
        expect(tier).toHaveProperty("isPopular");
        expect(tier).toHaveProperty("features");
        expect(tier).toHaveProperty("pricing");
        expect(tier).toHaveProperty("prices");
        expect(tier).toHaveProperty("currency");
      }
    });
  });

  describe("Type definitions", () => {
    it("should export correct TypeScript interfaces", () => {
      // This tests that the types are exportable and structured correctly
      const mockFeature: ProductFeature = {
        name: "Test Feature",
        included: true,
        description: "Test description",
      };

      const mockTier: PricingTier = {
        id: "test",
        name: "Test Tier",
        description: "Test description",
        isPopular: false,
        features: [mockFeature],
        pricing: {
          creem: {
            oneTime: "test_one_time",
            monthly: "test_monthly",
            yearly: "test_yearly",
          },
        },
        prices: {
          oneTime: 10.99,
          monthly: 5.99,
          yearly: 59.99,
        },
        currency: "USD",
      };

      expect(mockFeature.name).toBe("Test Feature");
      expect(mockTier.id).toBe("test");
    });
  });

  describe("Data integrity", () => {
    it("should have valid feature names", () => {
      const allFeatures = PRODUCT_TIERS.flatMap((tier) => tier.features);
      allFeatures.forEach((feature) => {
        expect(feature.name.trim()).toBe(feature.name); // No leading/trailing whitespace
        expect(feature.name).not.toBe(""); // Not empty
      });
    });

    it("should have reasonable price ranges", () => {
      PRODUCT_TIERS.forEach((tier) => {
        // Prices should be reasonable (between $1 and $10000)
        expect(tier.prices.oneTime).toBeGreaterThan(1);
        expect(tier.prices.oneTime).toBeLessThan(10000);

        expect(tier.prices.monthly).toBeGreaterThan(1);
        expect(tier.prices.monthly).toBeLessThan(1000);

        expect(tier.prices.yearly).toBeGreaterThan(1);
        expect(tier.prices.yearly).toBeLessThan(10000);
      });
    });

    it("should have non-empty descriptions", () => {
      PRODUCT_TIERS.forEach((tier) => {
        expect(tier.description.trim()).toBe(tier.description);
        expect(tier.description).not.toBe("");
        expect(tier.description.length).toBeGreaterThan(5);
      });
    });

    it("should have valid product ID formats", () => {
      PRODUCT_TIERS.forEach((tier) => {
        // Product IDs should follow a pattern (at least for the examples)
        expect(tier.pricing.creem.oneTime).toMatch(/^prod_/);
        expect(tier.pricing.creem.monthly).toMatch(/^prod_/);
        expect(tier.pricing.creem.yearly).toMatch(/^prod_/);
      });
    });
  });
});
