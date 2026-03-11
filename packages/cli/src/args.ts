export type ParsedCliArgs = {
  positionals: string[];
  baseUrl?: string;
  noBrowser: boolean;
};

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const args = argv.filter((arg) => arg !== "--");
  const positionals: string[] = [];
  let baseUrl: string | undefined;
  let noBrowser = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    if (arg === "--no-browser") {
      noBrowser = true;
      continue;
    }

    if (arg === "--base-url") {
      const nextValue = args[index + 1];
      if (!nextValue || nextValue.startsWith("--")) {
        throw new Error("Missing value for --base-url.");
      }

      baseUrl = normalizeBaseUrl(nextValue);
      index += 1;
      continue;
    }

    if (arg.startsWith("--base-url=")) {
      const value = arg.slice("--base-url=".length);
      if (!value) {
        throw new Error("Missing value for --base-url.");
      }

      baseUrl = normalizeBaseUrl(value);
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positionals.push(arg);
  }

  return {
    positionals,
    baseUrl,
    noBrowser,
  };
}
