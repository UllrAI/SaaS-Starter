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
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    content: (
      <>
        This starter kit saved me months of development time. The authentication system and payment
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
        Clean code, excellent documentation, and responsive support. Everything I needed to launch my
        SaaS product quickly.
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
        The UI components are beautiful and the dark mode implementation is perfect. My users love
        the interface.
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
        Best investment I&apos;ve made for my startup. The code quality is enterprise-grade and the
        architecture is scalable.
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
        Incredible attention to detail. The analytics dashboard and user management features are
        exactly what I needed.
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
        From idea to production in just 2 weeks. This starter kit is a game-changer for indie
        developers.
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

const stats = [
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

const companies = [
  { id: "supabase", name: "Supabase", icon: Zap, color: "text-blue-500" },
  { id: "neno", name: "Neno", icon: Database, color: "text-green-500" },
  { id: "github", name: "GitHub", icon: Github, color: "text-gray-700" },
  { id: "slack", name: "Slack", icon: Slack, color: "text-purple-500" },
  { id: "figma", name: "Figma", icon: Figma, color: "text-pink-500" },
  { id: "linkedin", name: "Linkedin", icon: Linkedin, color: "text-blue-500" },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <Card
      className={`h-full border border-border/60 transition-all duration-300 hover:border-primary/40 hover:shadow-lg ${
        testimonial.featured
          ? "bg-gradient-to-b from-primary/5 via-background to-background"
          : "bg-background/80"
      }`}
    >
      <CardContent className="p-6">
        {/* Quote Icon */}
        <div className="mb-4 inline-flex rounded-full bg-primary/10 p-2">
          <Quote className="text-primary/70 h-5 w-5" />
        </div>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-1">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        {/* Content */}
        <blockquote className="text-muted-foreground mb-6 text-sm leading-relaxed">
          &quot;{testimonial.content}&quot;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={testimonial.author.avatar}
              alt={testimonial.author.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {testimonial.author.initials}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="text-foreground text-sm font-medium">
              {testimonial.author.name}
            </div>
            <div className="text-muted-foreground text-xs">
              {testimonial.author.role} - {testimonial.author.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ stat }: { stat: (typeof stats)[0] }) {
  const IconComponent = stat.icon;

  return (
    <div className="border-border/50 bg-background/80 flex flex-col items-center rounded-2xl border px-6 py-5 text-center shadow-sm">
      <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
        <IconComponent className="h-6 w-6" />
      </div>
      <div className="text-foreground text-2xl font-bold">{stat.value}</div>
      <div className="text-foreground text-sm font-medium">{stat.label}</div>
      <div className="text-muted-foreground text-xs">{stat.description}</div>
    </div>
  );
}

export function SocialProofUnified() {
  return (
    <section className="relative py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-20">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="mr-2 h-3 w-3" />
              Trusted Worldwide
            </Badge>
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">
              Join thousands of developers
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Building successful SaaS products with our starter kit
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Users className="mr-2 h-3 w-3" />
              Customer Stories
            </Badge>

            <h3 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Loved by developers worldwide
            </h3>

            <p className="text-muted-foreground mt-4 text-lg">
              See what our community has to say about their experience
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Company Logos Section */}
        <div className="rounded-2xl border border-border/60 bg-background/80 px-6 py-10 text-center shadow-sm">
          <p className="text-muted-foreground mb-6 text-sm uppercase tracking-wide">
            Trusted by innovative companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {companies.map((company) => {
              const IconComponent = company.icon;
              return (
                <div
                  key={company.id}
                  className="text-muted-foreground/80 flex items-center gap-2 text-sm font-medium"
                >
                  <IconComponent className={`h-5 w-5 ${company.color}`} />
                  {company.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Want to share your success story?
          <a
            href="mailto:hello@example.com"
            className="text-primary ml-2 font-medium hover:underline"
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
}
