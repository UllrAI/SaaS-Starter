import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cacheDir = path.join(process.cwd(), "src", ".lingo", "cache");
const nextDir = path.join(process.cwd(), ".next");

async function main() {
  let files;
  try {
    files = await readdir(cacheDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Lingo Sync] Skip: cannot read cache dir (${message})`);
    return;
  }

  const localeFiles = files.filter((file) => file.endsWith(".json"));
  if (localeFiles.length === 0) {
    console.warn("[Lingo Sync] Skip: no locale cache files found");
    return;
  }

  await mkdir(nextDir, { recursive: true });

  let copied = 0;
  for (const file of localeFiles) {
    const source = path.join(cacheDir, file);
    const target = path.join(nextDir, file);
    const raw = await readFile(source, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !("entries" in parsed)) {
      console.warn(`[Lingo Sync] Skip invalid cache file: ${file}`);
      continue;
    }

    await writeFile(target, JSON.stringify(parsed), "utf8");
    copied += 1;
  }

  console.log(`[Lingo Sync] Copied ${copied} locale cache file(s) to .next`);
}

main().catch((error) => {
  console.error("[Lingo Sync] Failed:", error);
  process.exitCode = 1;
});
