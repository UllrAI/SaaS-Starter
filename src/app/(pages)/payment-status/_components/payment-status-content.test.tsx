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
          "We are still verifying this payment because the checkout reference is missing.",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Payment Processing")).toBeInTheDocument();
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
        screen.getByRole("heading", { name: "Payment Successful!" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Payment Completed")).toBeInTheDocument();
    expect(screen.getByText(/Transaction ID:/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Access Dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByRole("link", { name: /Manage Billing/i }),
    ).toHaveAttribute("href", "/dashboard/billing");
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
        screen.getByRole("heading", { name: "Payment Processing" }),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment Successful!" }),
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
        screen.getByRole("heading", { name: "Payment Failed" }),
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
        screen.getByRole("heading", { name: "Payment Cancelled" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to check payment status.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View Plans/i }),
    ).toHaveAttribute("href", "/pricing");

    consoleErrorSpy.mockRestore();
  });
});
