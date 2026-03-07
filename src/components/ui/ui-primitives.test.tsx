import { render, screen } from "@testing-library/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

describe("UI primitives", () => {
  it("renders button variants and supports asChild composition", () => {
    const { rerender } = render(
      <Button variant="destructive" size="lg" className="custom-class">
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toContain("bg-destructive");
    expect(button.className).toContain("h-10");
    expect(button.className).toContain("custom-class");

    rerender(
      <Button asChild variant="link">
        <a href="/pricing">Pricing</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link).toHaveAttribute("data-slot", "button");
    expect(link.className).toContain("underline-offset-4");
  });

  it("renders badge variants and forwards props through Slot", () => {
    const { rerender } = render(<Badge variant="secondary">Team</Badge>);

    const badge = screen.getByText("Team");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge.className).toContain("bg-secondary");

    rerender(
      <Badge asChild variant="outline">
        <a href="/plans">Plans</a>
      </Badge>,
    );

    const link = screen.getByRole("link", { name: "Plans" });
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link.className).toContain("text-foreground");
  });

  it("renders alert variants, title, and description", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Please update your card.</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert.className).toContain("text-destructive");
    expect(screen.getByText("Payment failed")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    expect(screen.getByText("Please update your card.")).toHaveAttribute(
      "data-slot",
      "alert-description",
    );
  });

  it("renders the card layout primitives", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Team billing details</CardDescription>
          <CardAction>Edit</CardAction>
        </CardHeader>
        <CardContent>Usage summary</CardContent>
        <CardFooter>Updated just now</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Workspace")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
    expect(screen.getByText("Team billing details")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByText("Edit")).toHaveAttribute("data-slot", "card-action");
    expect(screen.getByText("Usage summary")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
    expect(screen.getByText("Updated just now")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
  });
});
