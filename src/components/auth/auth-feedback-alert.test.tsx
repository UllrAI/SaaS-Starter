import { render, screen } from "@testing-library/react";
import { AuthFeedbackAlert } from "./auth-feedback-alert";
import type { ResolvedAuthFeedback } from "@/lib/auth/feedback";

describe("AuthFeedbackAlert", () => {
  it("renders nothing when feedback is absent", () => {
    const { container } = render(<AuthFeedbackAlert feedback={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the banned state with an optional ban reason", () => {
    const feedback: ResolvedAuthFeedback = {
      key: "banned",
      banReason: "Chargeback abuse",
    };

    render(<AuthFeedbackAlert feedback={feedback} />);

    expect(
      screen.getByText(
        "This account is disabled. Contact support. Reason: Chargeback abuse",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ["session_expired", "Your session ended. Sign in again to continue."],
    ["INVALID_TOKEN", "This sign-in link is invalid. Request a new one."],
    ["EXPIRED_TOKEN", "This sign-in link expired. Request a new one."],
    [
      "ATTEMPTS_EXCEEDED",
      "This sign-in link was already used. Request a new one.",
    ],
    [
      "please_restart_the_process",
      "The sign-in process was interrupted. Start again.",
    ],
    ["sign_in_failed", "Unable to sign in. Try again."],
  ] as const)("renders %s copy", (key, text) => {
    render(
      <AuthFeedbackAlert feedback={{ key } as ResolvedAuthFeedback} />,
    );

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("returns null for an unknown feedback key", () => {
    const { container } = render(
      <AuthFeedbackAlert
        feedback={{ key: "unexpected_key" } as unknown as ResolvedAuthFeedback}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
