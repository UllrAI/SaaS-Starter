import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Check Your Email - Magic Link Sent",
      description: "We've sent you a secure magic link to access your account",
    },
    "zh-Hans": {
      title: "请查收邮件",
      description: "我们已向您发送安全魔法链接，用于访问您的账户",
    },
  });
}

export default function SentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
