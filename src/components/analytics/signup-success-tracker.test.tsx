import { act, render } from "@testing-library/react";
import { SignupSuccessTracker } from "./signup-success-tracker";
import { trackUmamiEvent } from "@/lib/analytics/umami";

jest.mock("@/lib/analytics/umami", () => ({
  trackUmamiEvent: jest.fn(),
}));

describe("SignupSuccessTracker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    delete window.umami;
    window.history.replaceState(null, "", "/dashboard?signup=success&tab=home");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("removes the transient signal and tracks after Umami becomes ready", () => {
    render(<SignupSuccessTracker />);

    expect(window.location.search).toBe("?tab=home");
    expect(trackUmamiEvent).not.toHaveBeenCalled();

    window.umami = { track: jest.fn() } as unknown as UmamiTracker;
    act(() => jest.advanceTimersByTime(250));

    expect(trackUmamiEvent).toHaveBeenCalledWith("signup_success");
  });
});
