import { render, screen, waitFor } from "@testing-library/react";
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
});
