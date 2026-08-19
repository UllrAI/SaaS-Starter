const mockTransaction = jest.fn();
const mockCreateCustomer = jest.fn();
const mockForUpdate = jest.fn();
const mockSetCustomerId = jest.fn();

jest.mock("@/database", () => ({
  db: { transaction: mockTransaction },
}));
jest.mock(".", () => ({
  billing: { createCustomer: mockCreateCustomer },
}));

const tx = {
  select: () => ({
    from: () => ({
      where: () => ({ for: mockForUpdate }),
    }),
  }),
  update: () => ({
    set: (values: { paymentProviderCustomerId: string }) => ({
      where: async () => mockSetCustomerId(values.paymentProviderCustomerId),
    }),
  }),
};

const user = { id: "user_123", email: "user@example.com", name: "Taylor" };

describe("ensureBillingCustomerId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) => callback(tx));
  });

  it("reuses the stored customer without calling the provider", async () => {
    mockForUpdate.mockResolvedValue([{ customerId: "cus_stored" }]);
    const { ensureBillingCustomerId } = await import("./customer");

    await expect(ensureBillingCustomerId(user)).resolves.toBe("cus_stored");
    expect(mockCreateCustomer).not.toHaveBeenCalled();
    expect(mockSetCustomerId).not.toHaveBeenCalled();
  });

  it("creates and stores a customer on first checkout", async () => {
    mockForUpdate.mockResolvedValue([{ customerId: null }]);
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

  it("takes the row lock so parallel checkouts cannot fork the customer", async () => {
    mockForUpdate.mockResolvedValue([{ customerId: "cus_stored" }]);
    const { ensureBillingCustomerId } = await import("./customer");

    await ensureBillingCustomerId(user);
    expect(mockForUpdate).toHaveBeenCalledWith("update");
  });

  it("fails loudly when the user row is gone", async () => {
    mockForUpdate.mockResolvedValue([]);
    const { ensureBillingCustomerId } = await import("./customer");

    await expect(ensureBillingCustomerId(user)).rejects.toThrow(
      "User user_123 was not found.",
    );
    expect(mockCreateCustomer).not.toHaveBeenCalled();
  });
});
