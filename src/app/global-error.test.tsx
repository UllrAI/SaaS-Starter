import { fireEvent, render, screen } from "@testing-library/react";

import GlobalError from "./global-error";

describe("GlobalError", () => {
  it("renders a provider-independent fallback and retries", () => {
    const reset = jest.fn();

    render(<GlobalError error={new Error("boom")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Application error" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
