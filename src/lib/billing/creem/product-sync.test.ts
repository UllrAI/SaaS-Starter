import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCreemProductSpecs,
  findMatchingCreemProduct,
  updateProductsConfigSource,
} from "./product-sync";
import { PRODUCT_TIERS } from "@/lib/config/products";

describe("product-sync", () => {
  describe("buildCreemProductSpecs", () => {
    it("builds a product spec for each tier and billing variant", () => {
      const specs = buildCreemProductSpecs(PRODUCT_TIERS, "Starter");

      expect(specs).toHaveLength(PRODUCT_TIERS.length * 3);
      expect(specs[0]).toMatchObject({
        tierId: "plus",
        variant: "oneTime",
        name: "Starter Plus Lifetime",
        price: 1999,
        currency: "USD",
        billingType: "onetime",
        billingPeriod: "once",
      });
      expect(specs[1]).toMatchObject({
        tierId: "plus",
        variant: "monthly",
        name: "Starter Plus Monthly",
        price: 999,
        billingType: "recurring",
        billingPeriod: "every-month",
      });
      expect(specs[2]).toMatchObject({
        tierId: "plus",
        variant: "yearly",
        name: "Starter Plus Yearly",
        price: 9999,
        billingType: "recurring",
        billingPeriod: "every-year",
      });
    });
  });

  describe("findMatchingCreemProduct", () => {
    it("matches an existing product by name and billing attributes", () => {
      const [spec] = buildCreemProductSpecs(PRODUCT_TIERS, "Starter");
      const match = findMatchingCreemProduct(
        [
          {
            id: "prod_existing",
            mode: "prod",
            object: "product",
            name: spec.name,
            description: spec.description,
            price: spec.price,
            currency: spec.currency,
            billingType: spec.billingType,
            billingPeriod: spec.billingPeriod,
            status: "active",
            taxMode: "exclusive",
            taxCategory: "saas",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        spec,
      );

      expect(match?.id).toBe("prod_existing");
    });
  });

  describe("updateProductsConfigSource", () => {
    it("replaces product ids for the matching tier and variant", () => {
      const productsConfigPath = resolve(
        process.cwd(),
        "src/lib/config/products.ts",
      );
      const source = readFileSync(productsConfigPath, "utf8");
      const currentPlusTier = PRODUCT_TIERS.find((tier) => tier.id === "plus");

      const updated = updateProductsConfigSource(source, [
        {
          ...buildCreemProductSpecs(PRODUCT_TIERS)[0],
          productId: "prod_new_one_time",
          created: true,
        },
        {
          ...buildCreemProductSpecs(PRODUCT_TIERS)[1],
          productId: "prod_new_monthly",
          created: false,
        },
      ]);

      expect(currentPlusTier).toBeDefined();
      expect(updated).toContain('oneTime: "prod_new_one_time"');
      expect(updated).toContain('monthly: "prod_new_monthly"');
      expect(updated).toContain(
        `yearly: "${currentPlusTier!.pricing.creem.yearly}"`,
      );
    });
  });
});
