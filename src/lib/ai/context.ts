import type { SupportedLocale } from "@/lib/config/i18n";

// Per-request context injected into agents and tools. Built from the
// authenticated session in the chat route; never trust client input for it.
export interface AgentContext {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  locale: SupportedLocale;
}
