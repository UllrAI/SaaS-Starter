import { act, render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { PaymentStatusContent } from "./payment-status-content";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe("PaymentStatusContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    jest.useRealTimers();
  });

  it("does not trust success without a checkout reference", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("status=success") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "We received the checkout return, but the checkout reference is missing. Check your billing page in a few minutes or contact support if access does not update.",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Payment processing")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renders a verified success state from the payment status API", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("session_id=checkout-123") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success" }),
    } as Response);

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment successful" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Payment completed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your payment is confirmed. Check your billing page for the latest access status.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Transaction ID:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Access Dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /View billing/i })).toHaveAttribute(
      "href",
      "/dashboard/billing",
    );
  });

  it("polls again when the payment remains pending", async () => {
    jest.useFakeTimers();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("session_id=checkout-999") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "pending" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success" }),
      } as Response);

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment processing" }),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment successful" }),
      ).toBeInTheDocument();
    });
  });

  it("renders direct terminal failure states without calling the API", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("status=failed") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment failed" }),
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("falls back to direct cancelled status when verification fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockUseSearchParams.mockReturnValue(
      new URLSearchParams(
        "status=cancelled&session_id=checkout-456",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new Error("network"),
    );

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment cancelled" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to check payment status."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View plans/i })).toHaveAttribute(
      "href",
      "/pricing",
    );

    consoleErrorSpy.mockRestore();
  });

  it("shows a controlled error for a terminal checkout verification failure", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams(
        "status=pending&session_id=checkout-401",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    render(<PaymentStatusContent />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to check payment status."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Payment processing" }),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it("treats inherited object keys in the status hint as unknown", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("status=__proto__") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<PaymentStatusContent />);
    expect(
      screen.getByRole("heading", { name: "Payment processing" }),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("clears a previous success and retries a new checkout after a temporary rate limit", async () => {
    jest.useFakeTimers();
    const fetchMock = jest.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "3" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "failed" }),
      } as Response);
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("session_id=old") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    const { rerender } = render(<PaymentStatusContent />);
    expect(
      await screen.findByRole("heading", { name: "Payment successful" }),
    ).toBeInTheDocument();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("sessionId=new") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    await act(async () => rerender(<PaymentStatusContent />));
    expect(
      screen.queryByRole("heading", { name: "Payment successful" }),
    ).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/payment-status?checkout_id=new",
    );
    await act(async () => jest.advanceTimersByTime(2_999));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => jest.advanceTimersByTime(1));
    expect(
      screen.getByRole("heading", { name: "Payment failed" }),
    ).toBeInTheDocument();
  });

  it("confirms a one-time payment without claiming access is already active", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("session_id=checkout-123") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "success",
        paymentMode: "one_time",
      }),
    } as Response);

    render(<PaymentStatusContent />);

    expect(
      await screen.findByText(
        "Your one-time payment is confirmed, with no recurring charge. Check your billing page for the latest access status.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/access is now active/i)).not.toBeInTheDocument();
  });
});
