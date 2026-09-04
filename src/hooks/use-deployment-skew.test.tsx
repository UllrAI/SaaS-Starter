import { beforeEach, describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";

jest.mock("sonner", () => ({
  toast: {
    warning: jest.fn(),
  },
}));

// jsdom's `location.reload` is read-only, so the reload seam is mocked instead.
jest.mock("@/lib/deployment-skew", () => ({
  ...(jest.requireActual("@/lib/deployment-skew") as object),
  reloadPage: jest.fn(),
}));

// Import after the mocks are set up.
import { toast } from "sonner";
import { reloadPage } from "@/lib/deployment-skew";
import { useDeploymentSkewGuard } from "./use-deployment-skew";

const mockToastWarning = toast.warning as jest.MockedFunction<
  typeof toast.warning
>;
const mockReloadPage = reloadPage as jest.MockedFunction<typeof reloadPage>;

type ToastOptions = {
  description: string;
  duration: number;
  className: string;
  action: { label: string; onClick: () => void };
};

describe("useDeploymentSkewGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the action result through untouched", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());

    await expect(result.current(async () => ({ data: "ok" }))).resolves.toEqual(
      { data: "ok" },
    );
    expect(mockToastWarning).not.toHaveBeenCalled();
  });

  it("swallows a deployment skew and offers a reload", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());

    await expect(
      result.current(async () => {
        throw new UnrecognizedActionError("action not found");
      }),
    ).resolves.toBeUndefined();

    expect(mockToastWarning).toHaveBeenCalledTimes(1);
    const [, options] = mockToastWarning.mock.calls[0] as [
      string,
      ToastOptions,
    ];
    expect(options.duration).toBe(Infinity);
    // The prompt renders over a Radix modal, which disables pointer events on
    // the body; without this class its reload button cannot be clicked.
    expect(options.className).toContain("pointer-events-auto");

    options.action.onClick();
    expect(mockReloadPage).toHaveBeenCalledTimes(1);
  });

  it("rethrows every other failure", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());

    await expect(
      result.current(async () => {
        throw new Error("network down");
      }),
    ).rejects.toThrow("network down");
    expect(mockToastWarning).not.toHaveBeenCalled();
  });

  it("keeps a stable identity across renders", () => {
    const { result, rerender } = renderHook(() => useDeploymentSkewGuard());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
