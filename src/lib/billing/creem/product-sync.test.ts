import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCreemProductSpecs,
  buildCreemProductIdempotencyKey,
  findMatchingCreemProduct,
  loadAllCreemProducts,
  updateProductsConfigSource,
} from "./product-sync";
import { PRODUCT_TIERS } from "@/lib/config/products";
import type { CreemClient } from "./api-client";

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
      });
      expect(specs[0].billingPeriod).toBeUndefined();
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

  describe("loadAllCreemProducts", () => {
    it("loads every page in order", async () => {
      const search = jest
        .fn()
        .mockResolvedValueOnce({
          items: [{ id: "prod_1" }],
          pagination: { nextPage: 2 },
        })
        .mockResolvedValueOnce({
          items: [{ id: "prod_2" }],
          pagination: { nextPage: null },
        });
      const client = {
        products: { search },
      } as unknown as CreemClient;

      await expect(loadAllCreemProducts(client)).resolves.toEqual([
        { id: "prod_1" },
        { id: "prod_2" },
      ]);
      expect(search).toHaveBeenNthCalledWith(1, 1, 100);
      expect(search).toHaveBeenNthCalledWith(2, 2, 100);
    });

    it("rejects pagination cycles", async () => {
      const search = jest.fn().mockResolvedValue({
        items: [],
        pagination: { nextPage: 1 },
      });
      const client = {
        products: { search },
      } as unknown as CreemClient;

      await expect(loadAllCreemProducts(client)).rejects.toThrow(
        "Creem product pagination repeated page 1.",
      );
      expect(search).toHaveBeenCalledTimes(1);
    });
  });

  describe("buildCreemProductIdempotencyKey", () => {
    it("is stable for the same product specification", () => {
      const [spec] = buildCreemProductSpecs(PRODUCT_TIERS, "Starter");

      expect(buildCreemProductIdempotencyKey("live_mode", spec)).toBe(
        buildCreemProductIdempotencyKey("live_mode", { ...spec }),
      );
    });

    it("changes when the environment or product specification changes", () => {
      const [spec] = buildCreemProductSpecs(PRODUCT_TIERS, "Starter");
      const original = buildCreemProductIdempotencyKey("live_mode", spec);

      expect(buildCreemProductIdempotencyKey("test_mode", spec)).not.toBe(
        original,
      );
      expect(
        buildCreemProductIdempotencyKey("live_mode", {
          ...spec,
          price: spec.price + 1,
        }),
      ).not.toBe(original);
      expect(
        buildCreemProductIdempotencyKey("live_mode", {
          ...spec,
          taxMode: "exclusive",
          description: `${spec.description} updated`,
        }),
      ).not.toBe(original);
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
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
        spec,
      );

      expect(match?.id).toBe("prod_existing");
    });

    it("matches one-time products without a billing period", () => {
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
            billingType: "onetime",
            status: "active",
            taxMode: "exclusive",
            taxCategory: "saas",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
        spec,
      );

      expect(match?.id).toBe("prod_existing");
    });

    it("does not reuse inactive products or products with different tax semantics", () => {
      const [spec] = buildCreemProductSpecs(PRODUCT_TIERS, "Starter");
      const product = {
        id: "prod_existing",
        mode: "prod",
        object: "product",
        name: spec.name,
        description: spec.description,
        price: spec.price,
        currency: spec.currency,
        billingType: spec.billingType,
        billingPeriod: spec.billingPeriod,
        status: "archived",
        taxMode: "exclusive",
        taxCategory: "saas",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      };

      expect(findMatchingCreemProduct([product], spec)).toBeUndefined();
      expect(
        findMatchingCreemProduct(
          [{ ...product, status: "active", taxMode: "inclusive" }],
          spec,
        ),
      ).toBeUndefined();
      expect(
        findMatchingCreemProduct(
          [
            {
              ...product,
              status: "active",
              description: `${spec.description} outdated`,
            },
          ],
          spec,
        ),
      ).toBeUndefined();
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

      const updated = updateProductsConfigSource(
        source,
        [
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
        ],
        "test_mode",
      );

      expect(currentPlusTier).toBeDefined();
      expect(updated).toContain(
        'test_mode: {\n          oneTime: "prod_new_one_time",\n          monthly: "prod_new_monthly"',
      );
      expect(updated).toContain(
        `oneTime: "${currentPlusTier!.pricing.creem.live_mode.oneTime}"`,
      );
    });
  });
});
