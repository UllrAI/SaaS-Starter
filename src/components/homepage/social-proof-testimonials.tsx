import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Quote,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  Github,
  Slack,
  Figma,
  Linkedin,
  Zap,
  Database,
  Terminal,
} from "lucide-react";

type Testimonial = {
  id: number;
  content: React.ReactNode;
  author: {
    name: string;
    role: React.ReactNode;
    company: string;
    avatar: string;
    initials: string;
  };
  rating: number;
  featured: boolean;
};

type Stat = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: React.ReactNode;
  description: React.ReactNode;
};

type Company = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  return (
    <Card className="border-border bg-card hover:border-primary h-full border transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--border)]">
      <CardContent className="p-6">
        {/* Quote Icon */}
        <div className="mb-4 inline-flex">
          <Quote className="text-primary h-6 w-6" />
        </div>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-1">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="fill-primary text-primary h-4 w-4" />
          ))}
        </div>

        {/* Content */}
        <blockquote className="text-muted-foreground mb-6 font-mono text-sm leading-relaxed">
          &quot;{testimonial.content}&quot;
        </blockquote>

        {/* Author */}
        <div className="border-border flex items-center gap-3 border-t pt-4">
          <Avatar className="border-border h-10 w-10 border">
            <AvatarImage
              src={testimonial.author.avatar}
              alt={testimonial.author.name}
            />
            <AvatarFallback className="bg-secondary text-primary font-bold">
              {testimonial.author.initials}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="text-foreground text-sm font-bold">
              {testimonial.author.name}
            </div>
            <div className="text-muted-foreground font-mono text-xs">
              {testimonial.author.role} @ {testimonial.author.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const IconComponent = stat.icon;

  return (
    <div className="group border-border bg-card hover:border-primary flex flex-col items-center border px-6 py-8 text-center transition-all">
      <div className="text-primary bg-secondary group-hover:bg-primary group-hover:text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center transition-colors">
        <IconComponent className="h-6 w-6" />
      </div>
      <div className="text-foreground text-3xl font-bold tracking-tight">
        {stat.value}
      </div>
      <div className="text-foreground mt-1 text-sm font-semibold">
        {stat.label}
      </div>
      <div className="text-muted-foreground mt-2 text-xs">
        {stat.description}
      </div>
    </div>
  );
}

export function SocialProofUnified() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      content: (
        <>
          This starter kit saved me months of development time. The payment
          integration work flawlessly out of the box.
        </>
      ),
      author: {
        name: "Sarah Chen",
        role: <>Founder</>,
        company: "TechFlow",
        avatar:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
        initials: "SC",
      },
      rating: 5,
      featured: true,
    },
    {
      id: 2,
      content: (
        <>
          Clean code, excellent documentation, and responsive support.
          Everything I needed to launch my SaaS product quickly.
        </>
      ),
      author: {
        name: "Marcus Rodriguez",
        role: <>CTO</>,
        company: "DataViz Pro",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        initials: "MR",
      },
      rating: 5,
      featured: false,
    },
    {
      id: 3,
      content: (
        <>
          The UI components are beautiful and the dark mode implementation is
          perfect. My users love the interface.
        </>
      ),
      author: {
        name: "Emily Watson",
        role: <>Product Manager</>,
        company: "CloudSync",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        initials: "EW",
      },
      rating: 5,
      featured: false,
    },
    {
      id: 4,
      content: (
        <>
          Best investment I&apos;ve made for my startup. The code quality is
          enterprise-grade and the architecture is scalable.
        </>
      ),
      author: {
        name: "David Kim",
        role: <>Lead Developer</>,
        company: "InnovateLab",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        initials: "DK",
      },
      rating: 5,
      featured: true,
    },
    {
      id: 5,
      content: (
        <>
          Incredible attention to detail. The analytics dashboard and user
          management features are exactly what I needed.
        </>
      ),
      author: {
        name: "Lisa Thompson",
        role: <>Entrepreneur</>,
        company: "StartupHub",
        avatar:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
        initials: "LT",
      },
      rating: 5,
      featured: false,
    },
    {
      id: 6,
      content: (
        <>
          From idea to production in just 2 weeks. This starter kit is a
          game-changer for indie developers.
        </>
      ),
      author: {
        name: "Alex Johnson",
        role: <>Indie Developer</>,
        company: "Solo Ventures",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        initials: "AJ",
      },
      rating: 5,
      featured: false,
    },
  ];

  const stats: Stat[] = [
    {
      id: "developers",
      icon: Users,
      value: "10,000+",
      label: <>Developers</>,
      description: <>Trust our starter</>,
    },
    {
      id: "projects",
      icon: TrendingUp,
      value: "500+",
      label: <>Projects</>,
      description: <>Built and launched</>,
    },
    {
      id: "uptime",
      icon: Award,
      value: "99.9%",
      label: <>Uptime</>,
      description: <>Guaranteed reliability</>,
    },
    {
      id: "rating",
      icon: CheckCircle,
      value: "4.9/5",
      label: <>Rating</>,
      description: <>Average user rating</>,
    },
  ];

  const companies: Company[] = [
    { id: "supabase", name: "Supabase", icon: Zap, color: "text-foreground" },
    { id: "neno", name: "Neno", icon: Database, color: "text-foreground" },
    { id: "github", name: "GitHub", icon: Github, color: "text-foreground" },
    { id: "slack", name: "Slack", icon: Slack, color: "text-foreground" },
    { id: "figma", name: "Figma", icon: Figma, color: "text-foreground" },
    {
      id: "linkedin",
      name: "Linkedin",
      icon: Linkedin,
      color: "text-foreground",
    },
  ];

  return (
    <section className="bg-background border-border relative border-b py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-24">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge
              variant="outline"
              className="border-primary text-primary mb-4"
            >
              <Terminal className="mr-2 h-3 w-3" />
              <>Metrics</>
            </Badge>
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">
              <>Join thousands of developers</>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              <>Building successful SaaS products with our starter kit</>
            </p>
          </div>

          <div className="bg-border border-border grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge
              variant="outline"
              className="border-primary text-primary mb-4"
            >
              <Users className="mr-2 h-3 w-3" />
              <>Community</>
            </Badge>

            <h3 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              <>Loved by developers worldwide</>
            </h3>

            <p className="text-muted-foreground mt-4 text-lg">
              <>See what our community has to say about their experience</>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Company Logos Section */}
        <div className="border-border border-t px-6 py-10 text-center">
          <p className="text-muted-foreground mb-8 text-xs tracking-widest uppercase">
            <>Trusted by innovative companies</>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
            {companies.map((company) => {
              const IconComponent = company.icon;
              return (
                <div
                  key={company.id}
                  className="text-foreground flex items-center gap-2 text-sm font-bold"
                >
                  <IconComponent className={`h-6 w-6`} />
                  {company.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-muted-foreground mt-12 text-center font-mono text-sm">
          <>Want to share your success story?</>
          <a
            href="mailto:hello@example.com"
            className="text-primary ml-2 font-bold hover:underline"
          >
            <>Get in touch</>
          </a>
        </div>
      </div>
    </section>
  );
}
