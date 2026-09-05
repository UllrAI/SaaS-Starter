import { Component, type ReactNode } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/actions/admin/users", () => ({
  getUsers: jest.fn(),
  updateUserAction: jest.fn(),
  setUserDisabledAction: jest.fn(),
}));

// Import after the mocks are set up.
import { toast } from "sonner";
import { getUsers, updateUserAction } from "@/lib/actions/admin/users";
import type { UserWithSubscription } from "@/types/billing";
import { UserManagementTable } from "./user-management-table";

const mockUpdateUser = updateUserAction as jest.MockedFunction<
  typeof updateUserAction
>;

const user: UserWithSubscription = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  role: "user",
  emailVerified: true,
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  subscriptions: [],
};

const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

// Stands in for `src/app/dashboard/error.tsx`, the boundary that wraps every
// admin page in the real tree.
class Boundary extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? <p>boundary</p> : this.props.children;
  }
}

async function openEditDialog() {
  render(
    <Boundary>
      <UserManagementTable
        initialData={[user]}
        initialPagination={pagination}
      />
    </Boundary>,
  );

  // Row 0 is the header. The edit button is the only button in a data row.
  const row = screen.getAllByRole("row")[1];
  fireEvent.click(within(row).getByRole("button"));
  await screen.findByText("Edit User");
}

describe("UserManagementTable action failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    (getUsers as jest.Mock).mockResolvedValue({ data: [user], pagination });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("hands a deployment skew to the error boundary", async () => {
    // The action is awaited inside `startTransition` without a try/catch on
    // purpose: React routes the rejection to the nearest boundary, which is
    // where the reload prompt lives.
    mockUpdateUser.mockRejectedValue(
      new UnrecognizedActionError("action not found"),
    );

    await openEditDialog();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("boundary")).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("still reports an ordinary action failure", async () => {
    mockUpdateUser.mockResolvedValue({
      serverError: "boom",
    } as unknown as Awaited<ReturnType<typeof updateUserAction>>);

    await openEditDialog();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
    // A real failure leaves the dialog open so the edit can be retried.
    expect(screen.getByText("Edit User")).toBeInTheDocument();
  });
});
