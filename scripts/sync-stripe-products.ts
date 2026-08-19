import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import prettier from "prettier";
import Stripe from "stripe";
import { z } from "zod";

import { STRIPE_API_VERSION } from "@/lib/billing/stripe/api-version";
import {
  buildStripePriceSpecs,
  type ResolvedStripePrice,
  type StripePriceSpec,
  updatePricesConfigSource,
} from "@/lib/billing/stripe/product-sync";
import { PRODUCT_TIERS } from "@/lib/config/products";

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
});

async function main() {
  const env = envSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_ENVIRONMENT: process.env.STRIPE_ENVIRONMENT,
  });
  assertKeyMatchesEnvironment(env.STRIPE_SECRET_KEY, env.STRIPE_ENVIRONMENT);

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    timeout: 10_000,
    telemetry: false,
  });
  const prefix = getArgumentValue("--prefix") ?? (await readPackageName());
  const specs = buildStripePriceSpecs(PRODUCT_TIERS, prefix);
  const products = new Map<string, Stripe.Product>();
  const resolvedPrices: ResolvedStripePrice[] = [];

  for (const spec of specs) {
    let product = products.get(spec.tierId);
    if (!product) {
      product = await findOrCreateProduct(stripe, spec);
      products.set(spec.tierId, product);
    }
    resolvedPrices.push(await resolvePrice(stripe, product, spec));
  }

  await writeResolvedPrices(resolvedPrices, env.STRIPE_ENVIRONMENT);
  printSummary(env.STRIPE_ENVIRONMENT, prefix, resolvedPrices);
}

async function findOrCreateProduct(
  stripe: Stripe,
  spec: StripePriceSpec,
): Promise<Stripe.Product> {
  let managedProduct: Stripe.Product | undefined;
  for await (const product of stripe.products.list({
    active: true,
    limit: 100,
  })) {
    if (
      product.metadata.tierId === spec.tierId &&
      product.metadata.managedBy === "saas-starter"
    ) {
      if (managedProduct && managedProduct.id !== product.id) {
        throw new Error(
          `Stripe has multiple managed Products for tier "${spec.tierId}"; resolve the catalog ambiguity before syncing prices.`,
        );
      }
      managedProduct = product;
    }
  }

  if (managedProduct) {
    if (managedProduct.name !== spec.productName) {
      return stripe.products.update(managedProduct.id, {
        name: spec.productName,
      });
    }
    return managedProduct;
  }

  return stripe.products.create(
    {
      name: spec.productName,
      metadata: { managedBy: "saas-starter", tierId: spec.tierId },
    },
    { idempotencyKey: `product:${spec.lookupKey}` },
  );
}

async function resolvePrice(
  stripe: Stripe,
  product: Stripe.Product,
  spec: StripePriceSpec,
): Promise<ResolvedStripePrice> {
  const existing = await stripe.prices.list({
    active: true,
    lookup_keys: [spec.lookupKey],
    limit: 1,
  });
  const price = existing.data[0];
  if (price && priceMatches(price, product.id, spec)) {
    if (!priceMetadataMatches(price, spec)) {
      await stripe.prices.update(price.id, {
        metadata: buildPriceMetadata(spec),
      });
    }
    return {
      ...spec,
      productId: product.id,
      priceId: price.id,
      created: false,
    };
  }

  const created = await stripe.prices.create(
    {
      product: product.id,
      nickname: spec.nickname,
      lookup_key: spec.lookupKey,
      transfer_lookup_key: true,
      unit_amount: spec.unitAmount,
      currency: spec.currency,
      recurring: spec.recurring,
      tax_behavior: "exclusive",
      metadata: buildPriceMetadata(spec),
    },
    {
      idempotencyKey: [
        "price",
        spec.lookupKey,
        product.id,
        spec.unitAmount,
        spec.currency,
        spec.recurring?.interval ?? "once",
      ].join(":"),
    },
  );
  if (price) await stripe.prices.update(price.id, { active: false });
  return {
    ...spec,
    productId: product.id,
    priceId: created.id,
    created: true,
  };
}

function buildPriceMetadata(spec: StripePriceSpec) {
  return {
    managedBy: "saas-starter",
    tierId: spec.tierId,
    variant: spec.variant,
  };
}

function priceMetadataMatches(price: Stripe.Price, spec: StripePriceSpec) {
  return Object.entries(buildPriceMetadata(spec)).every(
    ([key, value]) => price.metadata[key] === value,
  );
}

function priceMatches(
  price: Stripe.Price,
  productId: string,
  spec: StripePriceSpec,
): boolean {
  const priceProductId =
    typeof price.product === "string" ? price.product : price.product.id;
  return (
    priceProductId === productId &&
    price.unit_amount === spec.unitAmount &&
    price.currency === spec.currency &&
    price.recurring?.interval === spec.recurring?.interval
  );
}

async function writeResolvedPrices(
  resolvedPrices: ResolvedStripePrice[],
  environment: "test_mode" | "live_mode",
) {
  const configPath = resolve(process.cwd(), "src/lib/billing/stripe/prices.ts");
  const source = await readFile(configPath, "utf8");
  const nextSource = updatePricesConfigSource(
    source,
    resolvedPrices,
    environment,
  );
  if (source === nextSource) return;

  // The price lists are written on one line; let Prettier decide where they
  // wrap so the committed file still passes `pnpm prettier:check`.
  const options = await prettier.resolveConfig(configPath);
  await writeFile(
    configPath,
    await prettier.format(nextSource, {
      ...options,
      filepath: configPath,
    }),
    "utf8",
  );
}

function assertKeyMatchesEnvironment(
  key: string,
  environment: "test_mode" | "live_mode",
) {
  const expectedSuffix = environment === "test_mode" ? "test" : "live";
  if (!new RegExp(`^(?:sk|rk)_${expectedSuffix}_`).test(key)) {
    throw new Error(
      `STRIPE_SECRET_KEY does not match STRIPE_ENVIRONMENT=${environment}.`,
    );
  }
}

function getArgumentValue(flag: string): string | undefined {
  const argument = process.argv.find((value) => value.startsWith(`${flag}=`));
  return argument?.slice(flag.length + 1).trim() || undefined;
}

async function readPackageName(): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  ) as { name?: string };
  return humanizePackageName(packageJson.name || "SaaS Starter");
}

function humanizePackageName(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

function printSummary(
  environment: "test_mode" | "live_mode",
  prefix: string,
  prices: ResolvedStripePrice[],
) {
  console.log(`Stripe environment: ${environment}`);
  console.log(`Product prefix: ${prefix}`);
  for (const price of prices) {
    console.log(
      `${price.tierId}.${price.variant} | ${price.created ? "created" : "reused"} | ${price.priceId} | ${price.nickname}`,
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to sync Stripe products: ${message}`);
  process.exit(1);
});
