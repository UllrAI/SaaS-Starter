import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Lightbulb, Heart, Globe, Award, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { COMPANY_NAME } from "@/lib/config/constants";
import { BackgroundPattern } from "@/components/ui/background-pattern";

export const metadata = createMetadata({
  title: "About Us",
  description:
    "Learn about our mission to help developers build and launch SaaS products faster than ever before.",
});

interface TeamMember {
  id: string;
  name: string;
  role: React.ReactNode;
  bio: React.ReactNode;
  image: string;
}

interface CompanyValue {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
}

interface Milestone {
  id: string;
  year: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}

const teamMembers: TeamMember[] = [
  {
    id: "alex-chen",
    name: "Alex Chen",
    role: <>CEO & Founder</>,
    bio: (
      <>
        Former tech lead at major SaaS companies. Passionate about developer tools.
      </>
    ),
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?fit=crop&crop=face",
  },
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    role: <>CTO</>,
    bio: (
      <>
        Full-stack engineer with 10+ years building scalable applications.
      </>
    ),
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?fit=crop&crop=face",
  },
  {
    id: "mike-rodriguez",
    name: "Mike Rodriguez",
    role: <>Head of Product</>,
    bio: (
      <>
        Product strategist focused on developer experience and user success.
      </>
    ),
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?fit=crop&crop=face",
  },
];

const values: CompanyValue[] = [
  {
    id: "mission-driven",
    icon: Target,
    title: <>Mission-Driven</>,
    description: (
      <>
        We&apos;re committed to democratizing SaaS development and making it accessible to everyone.
      </>
    ),
  },
  {
    id: "innovation-first",
    icon: Lightbulb,
    title: <>Innovation First</>,
    description: (
      <>
        We constantly push the boundaries of what&apos;s possible in developer tooling.
      </>
    ),
  },
  {
    id: "community-focused",
    icon: Heart,
    title: <>Community Focused</>,
    description: (
      <>
        Our success is measured by the success of the developers who use our platform.
      </>
    ),
  },
  {
    id: "global-impact",
    icon: Globe,
    title: <>Global Impact</>,
    description: (
      <>
        Building tools that empower developers worldwide to create amazing products.
      </>
    ),
  },
];

const milestones: Milestone[] = [
  {
    id: "milestone-2023-founded",
    year: <>2023</>,
    title: <>Company Founded</>,
    description: <>Started with a vision to simplify SaaS development</>,
  },
  {
    id: "milestone-2024-developers",
    year: <>2024</>,
    title: <>10K+ Developers</>,
    description: <>Reached our first major milestone of active users</>,
  },
  {
    id: "milestone-2024-funding",
    year: <>2024</>,
    title: <>Series A Funding</>,
    description: <>Secured funding to accelerate product development</>,
  },
  {
    id: "milestone-2024-enterprise",
    year: <>2024</>,
    title: <>Enterprise Launch</>,
    description: <>Launched enterprise features for larger teams</>,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-background relative overflow-hidden py-24">
        <BackgroundPattern />

        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="border-border bg-background/50 mb-6 inline-flex items-center rounded-full border px-3 py-1 text-sm backdrop-blur-sm">
              <Sparkles className="text-primary mr-2 h-3 w-3" />
              <span className="text-muted-foreground">
                Building the future of SaaS development
              </span>
            </div>

            <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              About <span className="text-primary">{COMPANY_NAME}</span>
            </h1>

            <p className="text-muted-foreground mb-8 text-xl leading-relaxed">
              We&apos;re on a mission to democratize SaaS development by
              providing developers with the tools, templates, and infrastructure
              they need to build and launch successful products faster than ever
              before.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/careers">Join Our Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Our Values
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.id} className="text-center shadow-sm">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              The passionate individuals behind {COMPANY_NAME}
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={150}
                      height={150}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <h3 className="mb-1 font-semibold">{member.name}</h3>
                  <p className="text-primary mb-3 text-sm">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Our Journey
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Key milestones in our mission to transform SaaS development
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                      <Award className="text-primary-foreground h-5 w-5" />
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="bg-border mt-4 h-16 w-px" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="mb-2 flex items-center gap-3">
                      <Badge variant="secondary">{milestone.year}</Badge>
                      <h3 className="font-semibold">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of developers who are already building the next
              generation of SaaS products.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">Get Started Today</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
