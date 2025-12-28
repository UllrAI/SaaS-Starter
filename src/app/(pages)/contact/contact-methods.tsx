"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Technical support via email",
    action: "support@company.com",
    href: "mailto:support@company.com",
    label: "EMAIL_GATEWAY",
    actionSkip: true,
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Real-time developer support",
    action: "Start Chat",
    href: "#",
    label: "CHAT_INTERFACE",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Direct engineering line",
    action: "+1 (555) 123-4567",
    href: "tel:+15551234567",
    label: "VOICE_CHANNEL",
    actionSkip: true,
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Engineering headquarters",
    action: "123 Business St, City, State 12345",
    href: "#",
    label: "PHYSICAL_LOCATION",
    actionSkip: true,
  },
];

export function ContactMethods() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {contactMethods.map((method) => {
        const Icon = method.icon;
        return (
          <Card
            key={method.title}
            className="group shadow-sm transition-all hover:shadow-md"
          >
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{method.title}</CardTitle>
              <p className="text-muted-foreground font-mono text-[10px] uppercase">
                {method.label}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                {method.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full shadow-xs"
                asChild
              >
                <a
                  href={method.href}
                  className="block font-mono text-xs"
                  data-lingo-skip={method.actionSkip ? true : undefined}
                >
                  {method.action}
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
