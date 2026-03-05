import { render, screen, waitFor } from "@testing-library/react";
import { SessionGuard } from "./session-guard";
import { useSession } from "@/lib/auth/client";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type AppRouterInstance,
} from "next/navigation";
import { toast } from "sonner";

jest.mock("@/lib/auth/client", () => ({
  useSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockReplace = jest.fn();

function createRouterMock(): AppRouterInstance {
  return {
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    replace: mockReplace,
  };
}

describe("SessionGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(createRouterMock());
    mockUsePathname.mockReturnValue("/dashboard/settings");
    mockUseSearchParams.mockReturnValue({
      toString: () => "page=billing",
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it("shows loading state while session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useSession>);

    render(
      <SessionGuard>
        <div data-testid="protected-content">Protected content</div>
      </SessionGuard>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.queryByTestId("protected-content"),
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users once and does not keep showing loading", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    const { rerender } = render(
      <SessionGuard>
        <div data-testid="protected-content">Protected content</div>
      </SessionGuard>,
    );

    rerender(
      <SessionGuard>
        <div data-testid="protected-content">Protected content</div>
      </SessionGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?callbackUrl=%2Fdashboard%2Fsettings%3Fpage%3Dbilling",
      );
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Your session has expired. Please log in again.",
    );
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("protected-content"),
    ).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
        },
      },
      isPending: false,
    } as ReturnType<typeof useSession>);

    render(
      <SessionGuard>
        <div data-testid="protected-content">Protected content</div>
      </SessionGuard>,
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });
});
