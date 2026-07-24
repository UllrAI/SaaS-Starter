import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = join(projectRoot, ".next", "standalone");

await mkdir(join(standaloneRoot, ".next"), { recursive: true });
await Promise.all([
  cp(join(projectRoot, "public"), join(standaloneRoot, "public"), {
    force: true,
    recursive: true,
  }),
  cp(
    join(projectRoot, ".next", "static"),
    join(standaloneRoot, ".next", "static"),
    {
      force: true,
      recursive: true,
    },
  ),
]);
