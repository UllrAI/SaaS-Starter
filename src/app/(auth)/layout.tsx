import { AppProviders } from "@/components/app-providers";
import {
  AppDocument,
  createRootMetadata,
} from "@/components/layout/app-document";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";
import { AuthShell } from "./_components/auth-shell";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = await createRootMetadata(locale);
  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);

  return (
    <AppDocument locale={locale} messages={messages}>
      <AppProviders>
        <AuthShell>{children}</AuthShell>
      </AppProviders>
    </AppDocument>
  );
}
