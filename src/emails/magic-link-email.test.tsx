import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import { MagicLinkEmailTemplate } from "./magic-link-email";

const baseCopy = {
  preview: "Preview copy",
  heading: "Access your account securely",
  intro: "Use the link below to finish signing in.",
  greeting: "Hello,",
  requestDetails: "We received a sign-in request.",
  cta: "Sign in",
  securityReminder: "If you didn't request this, ignore this email.",
  fallback: "If the button doesn't work, use this link:",
  sentToLabel: "Sent to:",
  footer: "Starter App security notice",
};

describe("MagicLinkEmailTemplate", () => {
  it("renders the primary email content", () => {
    render(
      <MagicLinkEmailTemplate
        copy={baseCopy}
        email="user@example.com"
        url="https://example.com/magic-link"
        appName="Starter App"
        locale="en"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Access your account securely" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Use the link below to finish signing in.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "https://example.com/magic-link",
    );
    expect(screen.getByRole("link", { name: "user@example.com" })).toHaveAttribute(
      "href",
      "mailto:user@example.com",
    );
  });

  it("renders device details only when present", () => {
    const copyWithDeviceDetails = {
      ...baseCopy,
      deviceDetailsTitle: "Sign-in request details",
      deviceLine: "Device: Safari on macOS",
      locationLine: "Location: Shanghai, CN (approximate)",
    };

    const { rerender } = render(
      <MagicLinkEmailTemplate
        copy={copyWithDeviceDetails}
        email="user@example.com"
        url="https://example.com/magic-link"
        appName="Starter App"
        locale="en"
      />,
    );

    expect(screen.getByText("Sign-in request details")).toBeInTheDocument();
    expect(screen.getByText("Device: Safari on macOS")).toBeInTheDocument();
    expect(
      screen.getByText("Location: Shanghai, CN (approximate)"),
    ).toBeInTheDocument();

    rerender(
      <MagicLinkEmailTemplate
        copy={baseCopy}
        email="user@example.com"
        url="https://example.com/magic-link"
        appName="Starter App"
        locale="en"
      />,
    );

    expect(
      screen.queryByText("Sign-in request details"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Device: Safari on macOS")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Location: Shanghai, CN (approximate)"),
    ).not.toBeInTheDocument();
  });
});
