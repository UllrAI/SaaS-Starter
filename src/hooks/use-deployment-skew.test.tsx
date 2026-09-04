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
  id: string;
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
    // A fixed id collapses repeated skews into one prompt instead of stacking.
    expect(options.id).toBe("deployment-skew");
    // The prompt renders over a Radix modal, which disables pointer events on
    // the body; without this class its reload button cannot be clicked.
    expect(options.className).toContain("pointer-events-auto");

    options.action.onClick();
    expect(mockReloadPage).toHaveBeenCalledTimes(1);
  });

  it("reuses one prompt when several calls skew", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());
    const skew = async () => {
      throw new UnrecognizedActionError("action not found");
    };

    await result.current(skew);
    await result.current(skew);

    const ids = mockToastWarning.mock.calls.map(
      ([, options]) => (options as ToastOptions).id,
    );
    expect(ids).toEqual(["deployment-skew", "deployment-skew"]);
  });

  it("closes the dialog and still prompts", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());
    const onSkew = jest.fn();

    await result.current(async () => {
      throw new UnrecognizedActionError("action not found");
    }, onSkew);

    expect(onSkew).toHaveBeenCalledTimes(1);
    expect(mockToastWarning).toHaveBeenCalledTimes(1);
  });

  it("leaves onSkew alone when the action simply fails", async () => {
    const { result } = renderHook(() => useDeploymentSkewGuard());
    const onSkew = jest.fn();

    await expect(
      result.current(async () => {
        throw new Error("network down");
      }, onSkew),
    ).rejects.toThrow("network down");
    expect(onSkew).not.toHaveBeenCalled();
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
