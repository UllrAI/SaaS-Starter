import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTACT_EMAIL } from "@/lib/config/constants";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

interface ContactMethod {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  contact: React.ReactNode;
  availability: React.ReactNode;
}

const contactMethods: ContactMethod[] = [
  {
    id: "contact-email",
    icon: Mail,
    title: <>Email Support</>,
    description: <>Get help from our support team</>,
    contact: <>{CONTACT_EMAIL}</>,
    availability: <>24/7 response within 4 hours</>,
  },
  {
    id: "contact-phone",
    icon: Phone,
    title: <>Phone Support</>,
    description: <>Speak directly with our team</>,
    contact: <>+1 (555) 123-4567</>,
    availability: <>Mon-Fri, 9AM-6PM EST</>,
  },
  {
    id: "contact-chat",
    icon: MessageSquare,
    title: <>Live Chat</>,
    description: <>Instant help when you need it</>,
    contact: <>Available in dashboard</>,
    availability: <>Mon-Fri, 9AM-6PM EST</>,
  },
  {
    id: "contact-office",
    icon: MapPin,
    title: <>Office Address</>,
    description: <>Visit us in person</>,
    contact: <>123 Tech Street, San Francisco, CA 94105</>,
    availability: <>By appointment only</>,
  },
];

export function ContactMethods() {
  return (
    <>
      {/* Contact Methods */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">Get in Touch</h2>
              <p className="text-muted-foreground text-lg">
                Choose the best way to reach us
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card key={method.id} className="text-center">
                    <CardContent className="pt-6">
                      <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                        <Icon className="text-primary h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-semibold">{method.title}</h3>
                      <p className="text-muted-foreground mb-3 text-sm">
                        {method.description}
                      </p>
                      <p className="mb-2 text-sm font-medium">
                        {method.contact}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {method.availability}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
