import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
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

async function openEditDialog() {
  render(
    <UserManagementTable initialData={[user]} initialPagination={pagination} />,
  );

  // Row 0 is the header. The edit button is the only button in a data row.
  const row = screen.getAllByRole("row")[1];
  fireEvent.click(within(row).getByRole("button"));
  await screen.findByText("Edit User");
}

describe("UserManagementTable deployment skew", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUsers as jest.Mock).mockResolvedValue({
      data: [user],
      pagination,
    });
  });

  it("closes the dialog and prompts for a reload", async () => {
    // Without the dialog closing first, Radix keeps focus trapped and marks
    // everything outside it `aria-hidden` — including the toast that carries
    // the only way out.
    mockUpdateUser.mockRejectedValue(
      new UnrecognizedActionError("action not found"),
    );

    await openEditDialog();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.queryByText("Edit User")).not.toBeInTheDocument();
    });
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
    expect(toast.warning).not.toHaveBeenCalled();
    // A real failure leaves the dialog open so the edit can be retried.
    expect(screen.getByText("Edit User")).toBeInTheDocument();
  });
});
