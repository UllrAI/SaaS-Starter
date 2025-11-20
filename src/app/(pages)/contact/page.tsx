import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  HelpCircle,
  ExternalLink,
  Send,
} from "lucide-react";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { COMPANY_NAME } from "@/lib/config/constants";

export const metadata = createMetadata({
  title: "Contact Us",
  description: `Get in touch with our team. We are here to help with any questions about ${COMPANY_NAME}.`,
});

export default function ContactPage() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-20 text-center">
              <Badge className="border-border bg-background/50 mb-6 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <span className="text-muted-foreground font-mono">
                  CONTACT.md
                </span>
              </Badge>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Get in Touch
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                Have questions? Need support? Want to collaborate? We&apos;re
                here to help. Choose your preferred channel below.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Send className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Contact Channels</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Mail className="h-6 w-6" />
                    </div>
                    <CardTitle>Email Support</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      EMAIL_GATEWAY
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Technical support via email
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a
                        href="mailto:support@company.com"
                        className="font-mono text-xs"
                      >
                        support@company.com
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <CardTitle>Live Chat</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      CHAT_INTERFACE
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Real-time developer support
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <span className="font-mono text-xs">Start Chat</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Phone className="h-6 w-6" />
                    </div>
                    <CardTitle>Phone Support</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      VOICE_CHANNEL
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Direct engineering line
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a href="tel:+15551234567" className="font-mono text-xs">
                        +1 (555) 123-4567
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <CardTitle>Visit Us</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      PHYSICAL_LOCATION
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Engineering headquarters
                    </p>
                    <p className="font-mono text-xs leading-relaxed">
                      123 Business St, City, State 12345
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Support Hours */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Clock className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Support Hours</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Standard Support</CardTitle>
                    <CardDescription>
                      Available for all users and customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground text-sm">
                        Monday - Friday
                      </span>
                      <span className="font-mono text-sm">9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground text-sm">
                        Saturday
                      </span>
                      <span className="font-mono text-sm">10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground text-sm">
                        Sunday
                      </span>
                      <span className="font-mono text-sm">Closed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Premium Support</CardTitle>
                    <CardDescription>
                      Enterprise customers with SLA guarantees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground text-sm">
                        Availability
                      </span>
                      <span className="font-mono text-sm">24/7/365</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground text-sm">
                        Response Time
                      </span>
                      <span className="font-mono text-sm">&lt; 1 hour</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground text-sm">
                        Priority
                      </span>
                      <span className="font-mono text-sm">
                        Critical Priority
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <HelpCircle className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Quick Answers</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      What is the average response time?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      We typically respond to all inquiries within 24 hours
                      during business days. Premium customers receive responses
                      in under 1 hour.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Do you offer phone support?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Yes, phone support is available for enterprise customers.
                      Standard tier customers can upgrade to access phone
                      support.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Can I schedule a demo?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Absolutely! Contact our sales team via email or chat to
                      schedule a personalized demo of our platform.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Where can I find documentation?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                      Our comprehensive documentation covers all features,
                      APIs, and integrations.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" className="inline-flex items-center gap-2">
                        <span className="text-xs">View Docs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <ExternalLink className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Helpful Resources</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Documentation
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Complete guides and API references
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Community Forum
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Connect with other developers
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">Status Page</CardTitle>
                    <CardDescription className="text-xs">
                      Real-time system status updates
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of developers building amazing products with{" "}
              {COMPANY_NAME}.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
