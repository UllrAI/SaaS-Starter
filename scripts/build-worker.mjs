import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("dist/worker", { recursive: true });

await build({
  entryPoints: ["scripts/worker.ts"],
  outfile: "dist/worker/worker.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22.12",
  sourcemap: true,
  tsconfig: "tsconfig.json",
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  plugins: [
    {
      name: "forbid-next-server-boundaries",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^(server-only|next\/)/ }, (args) => ({
          errors: [
            {
              text: `Worker dependency ${args.path} is tied to the Next.js runtime.`,
            },
          ],
        }));
      },
    },
  ],
});
