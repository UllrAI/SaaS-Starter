import { tool } from "ai";
import { z } from "zod";
import { resolveIntlLocale } from "@/lib/locale";
import type { AgentContext } from "../context";

export function createGetCurrentTime(context: AgentContext) {
  const intlLocale = resolveIntlLocale(context.locale);

  return tool({
    description:
      "Get the current date and time. Use it whenever the answer depends on today's date or the current time.",
    inputSchema: z.object({
      timeZone: z
        .string()
        .describe('IANA time zone such as "Asia/Shanghai". Defaults to UTC.')
        .optional(),
    }),
    execute: ({ timeZone }) => {
      const now = new Date();
      const resolvedTimeZone = timeZone ?? "UTC";
      try {
        return {
          iso: now.toISOString(),
          timeZone: resolvedTimeZone,
          localized: new Intl.DateTimeFormat(intlLocale, {
            dateStyle: "full",
            timeStyle: "long",
            timeZone: resolvedTimeZone,
          }).format(now),
        };
      } catch {
        return { error: `Unknown time zone "${resolvedTimeZone}".` };
      }
    },
  });
}
