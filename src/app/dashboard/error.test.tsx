import { fireEvent, render, screen } from "@testing-library/react";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";

import { reloadPage } from "@/lib/deployment-skew";
import DashboardError from "./error";

jest.mock("@/lib/deployment-skew", () => ({
  ...(jest.requireActual("@/lib/deployment-skew") as object),
  reloadPage: jest.fn(),
}));

const mockReloadPage = reloadPage as jest.MockedFunction<typeof reloadPage>;

describe("DashboardError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("offers a retry for ordinary failures", () => {
    const reset = jest.fn();

    render(<DashboardError error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockReloadPage).not.toHaveBeenCalled();
  });

  it("offers a reload when the deployment moved on", () => {
    const reset = jest.fn();

    render(
      <DashboardError
        error={new UnrecognizedActionError("action not found")}
        reset={reset}
      />,
    );

    // `reset` would re-run the same stale bundle, so it must not be offered.
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(mockReloadPage).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });
});
