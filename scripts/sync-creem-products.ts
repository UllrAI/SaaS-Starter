import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Creem } from "creem";
import type { ProductEntity } from "creem/models/components";
import { z } from "zod";
import { PRODUCT_TIERS } from "@/lib/config/products";
import {
  buildCreemProductSpecs,
  type CreemProductSpec,
  findMatchingCreemProduct,
  type ResolvedCreemProduct,
  updateProductsConfigSource,
} from "@/lib/billing/creem/product-sync";

const envSchema = z.object({
  CREEM_API_KEY: z.string().min(1, "CREEM_API_KEY is required"),
  CREEM_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
});

const createProductResponseSchema = z.object({
  id: z.string(),
});

async function main() {
  const env = envSchema.parse({
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_ENVIRONMENT: process.env.CREEM_ENVIRONMENT,
  });

  const prefix =
    getArgumentValue("--prefix") ?? humanizePackageName(await readPackageName());
  const client = new Creem({
    serverIdx: env.CREEM_ENVIRONMENT === "live_mode" ? 0 : 1,
    apiKey: env.CREEM_API_KEY,
  });

  const existingProducts = await loadAllProducts(client);
  const specs = buildCreemProductSpecs(PRODUCT_TIERS, prefix);
  const resolvedProducts: ResolvedCreemProduct[] = [];

  for (const spec of specs) {
    const existingProduct = findMatchingCreemProduct(existingProducts, spec);

    if (existingProduct) {
      resolvedProducts.push({
        ...spec,
        productId: existingProduct.id,
        created: false,
      });
      continue;
    }

    const createdProduct = await createProduct(
      env.CREEM_API_KEY,
      env.CREEM_ENVIRONMENT,
      spec,
    );

    existingProducts.push(createdProduct);
    resolvedProducts.push({
      ...spec,
      productId: createdProduct.id,
      created: true,
    });
  }

  await writeResolvedProducts(resolvedProducts);
  printSummary(env.CREEM_ENVIRONMENT, prefix, resolvedProducts);
}

async function loadAllProducts(client: Creem): Promise<ProductEntity[]> {
  const products: ProductEntity[] = [];
  let pageNumber = 1;

  while (true) {
    const response = await client.products.search(pageNumber, 100);
    products.push(...response.items);

    if (!response.pagination.nextPage) {
      break;
    }

    pageNumber = response.pagination.nextPage;
  }

  return products;
}

async function createProduct(
  apiKey: string,
  environment: "test_mode" | "live_mode",
  spec: CreemProductSpec,
): Promise<ProductEntity> {
  const body = {
    name: spec.name,
    description: spec.description,
    price: spec.price,
    currency: spec.currency,
    billing_type: spec.billingType,
    tax_mode: "exclusive" as const,
    tax_category: "saas" as const,
    ...(spec.billingType === "recurring"
      ? { billing_period: spec.billingPeriod }
      : {}),
  };

  const response = await fetch("https://api.creem.io/v1/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Creem create product failed: ${response.status} ${response.statusText} ${body}`,
    );
  }

  const payload = createProductResponseSchema.parse(await response.json());
  const mode = environment === "live_mode" ? "prod" : "test";

  return {
    id: payload.id,
    mode,
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
  };
}

async function writeResolvedProducts(
  resolvedProducts: ResolvedCreemProduct[],
): Promise<void> {
  const productsConfigPath = resolve(process.cwd(), "src/lib/config/products.ts");
  const source = await readFile(productsConfigPath, "utf8");
  const nextSource = updateProductsConfigSource(source, resolvedProducts);

  if (source !== nextSource) {
    await writeFile(productsConfigPath, nextSource, "utf8");
  }
}

function printSummary(
  environment: "test_mode" | "live_mode",
  prefix: string,
  resolvedProducts: ResolvedCreemProduct[],
) {
  console.log(`Creem environment: ${environment}`);
  console.log(`Product prefix: ${prefix}`);

  for (const product of resolvedProducts) {
    const action = product.created ? "created" : "reused";
    console.log(
      [
        `${product.tierId}.${product.variant}`,
        action,
        product.productId,
        product.name,
      ].join(" | "),
    );
  }
}

function getArgumentValue(flag: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(`${flag}=`));
  return arg ? arg.slice(flag.length + 1).trim() : undefined;
}

async function readPackageName(): Promise<string> {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    name?: string;
  };

  return packageJson.name || "SaaS Starter";
}

function humanizePackageName(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to sync Creem products: ${message}`);
  process.exit(1);
});
