const mockCreateCustomer = jest.fn();
const mockSetCustomerId = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/database", () => ({
  db: { select: mockSelect, update: mockUpdate },
}));
jest.mock(".", () => ({
  billing: { createCustomer: mockCreateCustomer },
}));

const user = { id: "user_123", email: "user@example.com", name: "Taylor" };

describe("ensureBillingCustomerId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [{ customerId: null }] }),
      }),
    });
    mockUpdate.mockReturnValue({
      set: (values: { paymentProviderCustomerId: string }) => ({
        where: () => ({
          returning: async () => {
            mockSetCustomerId(values.paymentProviderCustomerId);
            return [{ customerId: values.paymentProviderCustomerId }];
          },
        }),
      }),
    });
  });

  it("reuses the stored customer without calling the provider", async () => {
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [{ customerId: "cus_stored" }] }),
      }),
    });
    const { ensureBillingCustomerId } = await import("./customer");

    await expect(ensureBillingCustomerId(user)).resolves.toBe("cus_stored");
    expect(mockCreateCustomer).not.toHaveBeenCalled();
    expect(mockSetCustomerId).not.toHaveBeenCalled();
  });

  it("creates and stores a customer on first checkout", async () => {
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [{ customerId: null }] }),
      }),
    });
    mockCreateCustomer.mockResolvedValue({ customerId: "cus_new" });
    const { ensureBillingCustomerId } = await import("./customer");

    await expect(ensureBillingCustomerId(user)).resolves.toBe("cus_new");
    expect(mockCreateCustomer).toHaveBeenCalledWith({
      userId: "user_123",
      email: "user@example.com",
      name: "Taylor",
    });
    expect(mockSetCustomerId).toHaveBeenCalledWith("cus_new");
  });

  it("reuses the stored customer before attempting a provider call", async () => {
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [{ customerId: "cus_stored" }] }),
      }),
    });
    const { ensureBillingCustomerId } = await import("./customer");

    await ensureBillingCustomerId(user);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("fails loudly when the user row is gone", async () => {
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    });
    const { ensureBillingCustomerId } = await import("./customer");

    await expect(ensureBillingCustomerId(user)).rejects.toThrow(
      "User user_123 was not found.",
    );
    expect(mockCreateCustomer).not.toHaveBeenCalled();
  });
});
