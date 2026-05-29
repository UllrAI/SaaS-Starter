import { LingoProvider } from "@lingo.dev/compiler/react/next";

import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function RequestLingoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();

  return (
    <LingoProvider initialLocale={locale} devWidget={{ enabled: false }}>
      {children}
    </LingoProvider>
  );
}
