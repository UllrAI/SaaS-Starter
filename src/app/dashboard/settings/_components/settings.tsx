"use client";

import React from "react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, CreditCard, Palette, UserCircle } from "lucide-react";
import { Session } from "@/types/auth";
import type { Subscription, PaymentRecord } from "@/types/billing";
import dynamic from "next/dynamic";
import type { ComponentType, FC } from "react";

// Dynamic imports for page components
const AccountPage = dynamic(() =>
  import("./account-page").then((mod) => mod.AccountPage),
);
const AppearancePage = dynamic(() =>
  import("./appearance-page").then((mod) => mod.AppearancePage),
);
const NotificationPage = dynamic(() =>
  import("./notifications-page").then((mod) => mod.NotificationPage),
);
const BillingPage = dynamic(() =>
  import("./billing-page").then((mod) => mod.BillingPage),
);

// Define Props for each page component
interface BillingPageProps {
  subscription: Subscription | null;
  payments: PaymentRecord[];
}

// Union type for all possible page props
export type SettingsPageProps = BillingPageProps | Record<string, never>; // For pages with no props like AccountPage, NotificationPage, and AppearancePage

// Unified tab configuration
interface SettingsTabConfig {
  name: React.ReactNode;
  value: string;
  icon: ComponentType<{ className?: string }>;
  component: FC<SettingsPageProps>;
}

const settingsTabsConfig: SettingsTabConfig[] = [
  {
    name: <>Account & Security</>,
    value: "account",
    icon: UserCircle,
    component: AccountPage as FC<SettingsPageProps>,
  },
  {
    name: <>Billing & Plans</>,
    value: "billing",
    icon: CreditCard,
    component: BillingPage as FC<SettingsPageProps>,
  },
  {
    name: <>Emails & Notifications</>,
    value: "notifications",
    icon: Bell,
    component: NotificationPage as FC<SettingsPageProps>,
  },
  {
    name: <>Appearance</>,
    value: "appearance",
    icon: Palette,
    component: AppearancePage as FC<SettingsPageProps>,
  },
];

export function Settings({
  subscription,
  payments,
}: {
  session: Session | null;
  subscription: Subscription | null;
  payments: PaymentRecord[];
}) {
  const [tab, setTab] = useQueryState("page", { defaultValue: "account" });

  const activeTabConfig = settingsTabsConfig.find((t) => t.value === tab);
  const ActiveComponent = activeTabConfig?.component;

  const getComponentProps = (): SettingsPageProps => {
    switch (tab) {
      case "billing":
        return { subscription, payments };
      case "account":
      case "notifications":
      case "appearance":
      default:
        return {} as Record<string, never>;
    }
  };

  return (
    <section className="grid grid-rows-[1fr] gap-6 lg:grid-cols-[280px_1fr]">
      <nav className="space-y-2">
        <div className="mb-4">
          <h3 className="text-muted-foreground mb-3 text-sm font-medium">
            Settings
          </h3>
        </div>
        {settingsTabsConfig.map((mappedTab) => (
          <Button
            key={mappedTab.value}
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start rounded-lg px-3 transition-all",
              tab === mappedTab.value
                ? "bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 border"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab(mappedTab.value)}
          >
            <mappedTab.icon className="mr-2 h-4 w-4" />
            {mappedTab.name}
          </Button>
        ))}
      </nav>
      <main className="flex-1 space-y-6">
        {ActiveComponent && <ActiveComponent {...getComponentProps()} />}
      </main>
    </section>
  );
}
