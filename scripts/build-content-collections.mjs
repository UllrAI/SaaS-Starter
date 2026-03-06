import { createBuilder } from "@content-collections/core";

async function main() {
  const builder = await createBuilder("content-collections.ts");
  await builder.build();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
