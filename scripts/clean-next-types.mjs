import { rmSync } from "node:fs";

for (const path of [".next/types", ".next/dev/types"]) {
  rmSync(path, { recursive: true, force: true });
}
