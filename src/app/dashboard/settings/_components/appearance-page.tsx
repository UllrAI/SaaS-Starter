"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/use-hydrated";

const ThemeCard = ({
  title,
  icon: Icon,
  isSelected,
}: {
  title: string;
  icon: LucideIcon;
  isSelected: boolean;
}) => {
  const isSystem = title === "System";

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className={`relative h-44 w-full rounded-lg border p-4 ${
          isSelected ? "border-2 border-blue-500" : "border-input"
        } ${
          isSystem
            ? "overflow-hidden"
            : title === "Dark"
              ? "bg-gray-900"
              : "bg-white"
        }`}
      >
        {isSystem ? (
          <>
            {/* Light half */}
            <div className="absolute inset-0 w-1/2 bg-white p-4 pb-20">
              <div className="flex items-center gap-2 text-gray-900">
                <Icon size={18} />
              </div>
              <div className="mt-3 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded bg-gray-200 ${
                      i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-1/3"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Dark half */}
            <div className="absolute inset-0 left-1/2 w-1/2 bg-gray-900 p-4 pb-20">
              <div className="flex items-center gap-2 text-white">
                <Icon size={18} />
              </div>
              <div className="mt-3 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded bg-gray-700 ${
                      i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-1/3"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-2 ${
                title === "Dark" ? "text-white" : "text-gray-900"
              }`}
            >
              <Icon size={18} />
            </div>
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded ${
                    title === "Dark" ? "bg-gray-700" : "bg-gray-200"
                  } ${i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-1/3"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <span className="px-1 text-sm font-medium">{title}</span>
    </div>
  );
};

export function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground mt-1">
          Customize the look and feel of your dashboard
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="text-primary h-5 w-5" />
            Theme Preferences
          </CardTitle>
          <CardDescription>
            Choose your preferred theme for the dashboard interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themes.map((themeOption) => (
              <div
                key={themeOption.value}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setTheme(themeOption.value)}
              >
                <ThemeCard
                  title={themeOption.name}
                  icon={themeOption.icon}
                  isSelected={
                    mounted
                      ? theme === themeOption.value
                      : themeOption.value === "light"
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
