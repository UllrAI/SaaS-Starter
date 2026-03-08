import React from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { SectionContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function SocialProofUnified() {
  const testimonials = [
    {
      id: "founder",
      quote: (
        <>
          “We replaced two weeks of setup work with one focused weekend.The starter provided a solid foundation rather than another disposable prototype.”
        </>
      ),
      author: <>Avery Chen</>,
      role: <>Indie founder</>,
      highlight: <>Preview copy for this demo section.</>,
    },
    {
      id: "agency",
      quote: (
        <>
          “Since auth and billing were already integrated, 
          the team could focus on developing the product.”
        </>
      ),
      author: <>Jordan Patel</>,
      role: <>Agency lead</>,
      highlight: <>Demo feedback</>,
    },
    {
      id: "product",
      quote: (
        <>
          “We retained the foundation, replaced the product logic, 
          and progressed much faster than starting from scratch.”
        </>
      ),
      author: <>Morgan Rivera</>,
      role: <>Product engineer</>,
      highlight: <>Placeholder endorsement</>,
    },
  ];

  return (
    <section className="bg-muted/30 border-border relative overflow-hidden border-b py-24">
      <div className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-32" />
      <SectionContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-primary text-primary mb-4"
            >
              <MessageSquareQuote className="mr-2 h-3 w-3" />
              <>Demo social proof</>
            </Badge>

            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              <>Trust by teams</>
            </h2>

            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8">
              <>
                The feedback should be replaced with verified customer
                testimonials before launch.
              </>
            </p>
          </div>

          <Card className="border-border bg-background/80 backdrop-blur-sm">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <MessageSquareQuote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    <>Demo content notice</>
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    <>
                      Keep the section and card rhythm, then swap in real names,
                      logos, and short outcome-driven quotes when customer proof
                      is available.
                    </>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.925fr)_minmax(0,0.925fr)]">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.id}
              className={`border-border bg-card h-full border transition-colors hover:border-primary/50 ${
                index === 0 ? "lg:-translate-y-2" : ""
              }`}
            >
              <CardContent className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-primary flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="h-4 w-4 fill-current"
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <MessageSquareQuote
                    className="text-primary/20 h-8 w-8 shrink-0"
                    aria-hidden="true"
                  />
                </div>

                <p className="text-foreground mt-6 flex-1 text-base leading-7 sm:text-[1.05rem]">
                  {testimonial.quote}
                </p>

                <div className="border-border mt-6 border-t pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {testimonial.author}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      <>Demo</>
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {testimonial.highlight}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
