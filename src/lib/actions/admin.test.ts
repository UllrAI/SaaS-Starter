import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock environment variables
const mockEnv = {
  CREEM_API_KEY: "test-creem-api-key",
};

// Mock all external dependencies
const mockDb = {
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
};

const mockUsers = {
  id: "users.id",
  name: "users.name",
  email: "users.email",
  emailVerified: "users.emailVerified",
  image: "users.image",
  role: "users.role",
  createdAt: "users.createdAt",
  updatedAt: "users.updatedAt",
  paymentProviderCustomerId: "users.paymentProviderCustomerId",
};

const mockSubscriptions = {
  id: "subscriptions.id",
  userId: "subscriptions.userId",
  subscriptionId: "subscriptions.subscriptionId",
  status: "subscriptions.status",
  productId: "subscriptions.productId",
  customerId: "subscriptions.customerId",
  currentPeriodStart: "subscriptions.currentPeriodStart",
  currentPeriodEnd: "subscriptions.currentPeriodEnd",
  canceledAt: "subscriptions.canceledAt",
  createdAt: "subscriptions.createdAt",
  updatedAt: "subscriptions.updatedAt",
};

const mockPayments = {
  id: "payments.id",
  userId: "payments.userId",
  paymentId: "payments.paymentId",
  amount: "payments.amount",
  currency: "payments.currency",
  status: "payments.status",
  paymentType: "payments.paymentType",
  productId: "payments.productId",
  subscriptionId: "payments.subscriptionId",
  createdAt: "payments.createdAt",
  updatedAt: "payments.updatedAt",
};

const mockUploads = {
  id: "uploads.id",
  userId: "uploads.userId",
  fileKey: "uploads.fileKey",
  url: "uploads.url",
  fileName: "uploads.fileName",
  fileSize: "uploads.fileSize",
  contentType: "uploads.contentType",
  createdAt: "uploads.createdAt",
};

const mockCount = jest.fn();
const mockEq = jest.fn();
const mockDesc = jest.fn();
const mockAsc = jest.fn();
const mockAnd = jest.fn();
const mockOr = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockIlike = jest.fn();
const mockLike = jest.fn();
const mockNot = jest.fn();
const mockInArray = jest.fn();

const mockGetProductTierById = jest.fn();
const mockGetProductTierByProductId = jest.fn();

const mockRequireAdmin = jest.fn();

const mockCreemClient = {
  cancelSubscription: jest.fn(),
};

const mockDeleteFileFromR2 = jest.fn();
const mockDeleteFilesFromR2 = jest.fn();

const mockRevalidatePath = jest.fn();

// Mock all imports
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  users: mockUsers,
  subscriptions: mockSubscriptions,
  payments: mockPayments,
  uploads: mockUploads,
  userRoleEnum: {
    enumValues: ["user", "admin", "super_admin"],
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: mockEq,
  desc: mockDesc,
  asc: mockAsc,
  count: mockCount,
  and: mockAnd,
  or: mockOr,
  gte: mockGte,
  lte: mockLte,
  ilike: mockIlike,
  like: mockLike,
  not: mockNot,
  inArray: mockInArray,
}));

jest.mock("@/lib/config/products", () => ({
  getProductTierById: mockGetProductTierById,
  getProductTierByProductId: mockGetProductTierByProductId,
}));

jest.mock("next-safe-action", () => ({
  createSafeActionClient: jest.fn(() => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    use: jest.fn((_middleware) => ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      schema: jest.fn((_schema) => ({
        action: jest.fn((handler) => handler),
      })),
    })),
  })),
}));

jest.mock("../auth/permissions", () => ({
  requireAdmin: mockRequireAdmin,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

jest.mock("../billing/creem/client", () => ({
  creemClient: mockCreemClient,
}));

jest.mock("@/env", () => mockEnv);

jest.mock("../r2", () => ({
  deleteFiles: mockDeleteFilesFromR2,
  deleteFile: mockDeleteFileFromR2,
}));

describe("Admin Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    mockDb.delete.mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getUsers", () => {
    it("should fetch users with default parameters", async () => {
      const mockUsersData = [
        {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          emailVerified: true,
          image: null,
          role: "user",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          subscriptionStatus: "active",
          subscriptionId: "sub1",
        },
      ];

      const mockTotalData = [{ total: 1 }];

      // Mock the complex query chain
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockUsersData),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockTotalData),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      // Import and test the function
      const { getUsers } = await import("./admin");

      const result = await getUsers({});

      expect(result).toEqual({
        data: [
          {
            id: "user1",
            name: "John Doe",
            email: "john@example.com",
            emailVerified: true,
            image: null,
            role: "user",
            createdAt: mockUsersData[0].createdAt,
            updatedAt: mockUsersData[0].updatedAt,
            subscriptions: [
              {
                subscriptionId: "sub1",
                status: "active",
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("should handle search parameter", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockIlike.mockReturnValue("like-condition");

      const { getUsers } = await import("./admin");

      await getUsers({ search: "john" });

      expect(mockIlike).toHaveBeenCalledWith(mockUsers.name, "%john%");
      expect(mockIlike).toHaveBeenCalledWith(mockUsers.email, "%john%");
      expect(mockOr).toHaveBeenCalled();
    });

    it("should handle role filter", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockEq.mockReturnValue("role-condition");

      const { getUsers } = await import("./admin");

      await getUsers({ role: "admin" });

      expect(mockEq).toHaveBeenCalledWith(mockUsers.role, "admin");
    });

    it("should handle pagination", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getUsers } = await import("./admin");

      await getUsers({ page: 2, limit: 10 });

      expect(mockQuery.offset).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it("should handle sorting", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockAsc.mockReturnValue("asc-sort");
      mockDesc.mockReturnValue("desc-sort");

      const { getUsers } = await import("./admin");

      // Test ascending sort
      await getUsers({ sortBy: "name", sortOrder: "asc" });
      expect(mockAsc).toHaveBeenCalledWith(mockUsers.name);

      // Reset mocks for next test
      jest.clearAllMocks();
      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      // Test descending sort
      await getUsers({ sortBy: "email", sortOrder: "desc" });
      expect(mockDesc).toHaveBeenCalledWith(mockUsers.email);
    });

    it("should handle users with existing subscriptions and new subscription data", async () => {
      const mockUsersData = [
        {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          emailVerified: true,
          image: null,
          role: "user",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          subscriptionStatus: "active",
          subscriptionId: "sub2", // Different subscription ID
        },
      ];

      const mockTotalData = [{ total: 1 }];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockUsersData),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockTotalData),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getUsers } = await import("./admin");

      const result = await getUsers({});

      // Should add the new subscription to existing subscriptions array
      expect(result.data[0].subscriptions).toHaveLength(1);
      expect(result.data[0].subscriptions[0]).toEqual({
        subscriptionId: "sub2",
        status: "active",
      });
    });
  });

  describe("getPayments", () => {
    it("should fetch payments with default parameters", async () => {
      const mockPaymentsData = [
        {
          id: "payment1",
          userId: "user1",
          paymentId: "pay_123",
          amount: 1000,
          currency: "usd",
          status: "succeeded",
          paymentType: "subscription",
          productId: "tier_pro",
          subscriptionId: "sub_123",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          user: {
            id: "user1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      ];

      const mockTotalData = [{ total: 1 }];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockPaymentsData),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockTotalData),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockGetProductTierByProductId.mockReturnValue({ name: "Pro Tier" });

      const { getPayments } = await import("./admin");

      const result = await getPayments({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: "payment1",
        userId: "user1",
        paymentId: "pay_123",
        amount: 1000,
        currency: "usd",
        status: "succeeded",
        tierName: "Pro Tier",
      });
      expect(result.pagination.total).toBe(1);
    });

    it("should handle status filter", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockEq.mockReturnValue("status-condition");

      const { getPayments } = await import("./admin");

      await getPayments({ status: "succeeded" });

      expect(mockEq).toHaveBeenCalledWith(mockPayments.status, "succeeded");
    });

    it("should handle date range filters", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockGte.mockReturnValue("gte-condition");
      mockLte.mockReturnValue("lte-condition");

      const { getPayments } = await import("./admin");

      await getPayments({
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      });

      expect(mockGte).toHaveBeenCalledWith(
        mockPayments.createdAt,
        new Date("2024-01-01"),
      );
      expect(mockLte).toHaveBeenCalledWith(
        mockPayments.createdAt,
        new Date("2024-01-31"),
      );
    });
  });

  describe("getSubscriptions", () => {
    it("should fetch subscriptions with default parameters", async () => {
      const mockSubscriptionsData = [
        {
          id: "sub1",
          subscriptionId: "sub_123",
          productId: "tier_pro",
          status: "active",
          currentPeriodStart: new Date("2024-01-01"),
          currentPeriodEnd: new Date("2024-02-01"),
          canceledAt: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          userId: "user1",
          customerId: "cus_123",
          user: {
            id: "user1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      ];

      const mockTotalData = [{ total: 1 }];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockSubscriptionsData),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockTotalData),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockGetProductTierById.mockReturnValue({ name: "Pro Plan" });

      const { getSubscriptions } = await import("./admin");

      const result = await getSubscriptions({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: "sub1",
        subscriptionId: "sub_123",
        status: "active",
        planName: "Pro Plan",
      });
    });

    it("should handle search and status filters", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockEq.mockReturnValue("status-condition");

      const { getSubscriptions } = await import("./admin");

      await getSubscriptions({ search: "john", status: "active" });

      expect(mockOr).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith(mockSubscriptions.status, "active");
    });
  });

  describe("getUploads", () => {
    it("should fetch uploads with default parameters", async () => {
      const mockUploadsData = [
        {
          id: "upload1",
          userId: "user1",
          fileKey: "files/test.jpg",
          url: "https://example.com/test.jpg",
          fileName: "test.jpg",
          fileSize: 1024,
          contentType: "image/jpeg",
          createdAt: new Date("2024-01-01"),
          user: {
            id: "user1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      ];

      const mockTotalData = [{ total: 1 }];

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockUploadsData),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockTotalData),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getUploads } = await import("./admin");

      const result = await getUploads({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: "upload1",
        fileName: "test.jpg",
        contentType: "image/jpeg",
      });
      expect(result.pagination.total).toBe(1);
    });

    it("should handle file type filters", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockLike.mockReturnValue("like-condition");

      const { getUploads } = await import("./admin");

      await getUploads({ fileType: "image" });

      expect(mockLike).toHaveBeenCalledWith(mockUploads.contentType, "image/%");
    });

    it("should handle search parameter", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockIlike.mockReturnValue("like-condition");

      const { getUploads } = await import("./admin");

      await getUploads({ search: "test.jpg" });

      expect(mockIlike).toHaveBeenCalledWith(
        mockUploads.fileName,
        "%test.jpg%",
      );
      expect(mockIlike).toHaveBeenCalledWith(mockUsers.email, "%test.jpg%");
      expect(mockIlike).toHaveBeenCalledWith(mockUsers.name, "%test.jpg%");
      expect(mockOr).toHaveBeenCalled();
    });

    it("should handle 'other' file type filter", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockLike.mockReturnValue("like-condition");
      mockNot.mockReturnValue("not-condition");
      mockAnd.mockReturnValue("and-condition");

      const { getUploads } = await import("./admin");

      await getUploads({ fileType: "other" });

      // Should use not() to exclude all standard file types
      expect(mockNot).toHaveBeenCalled();
      expect(mockAnd).toHaveBeenCalled();
    });
  });

  describe("updateUserAction", () => {
    it("should update user successfully", async () => {
      const mockUser = { role: "user" };
      const mockContext = { user: { id: "admin1", role: "admin" } };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const { updateUserAction } = await import("./admin");

      const result = await updateUserAction({
        parsedInput: { id: "user1", name: "New Name", role: "admin" },
        ctx: mockContext,
      });

      expect(result).toEqual({
        success: true,
        message: "User updated successfully.",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/admin/users");
    });

    it("should throw error when user not found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { updateUserAction } = await import("./admin");

      await expect(
        updateUserAction({
          parsedInput: { id: "nonexistent", name: "New Name" },
          ctx: { user: { id: "admin1", role: "admin" } },
        }),
      ).rejects.toThrow("User not found");
    });

    it("should prevent modifying super_admin without super_admin role", async () => {
      const mockUser = { role: "super_admin" };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const { updateUserAction } = await import("./admin");

      await expect(
        updateUserAction({
          parsedInput: { id: "user1", name: "New Name" },
          ctx: { user: { id: "admin1", role: "admin" } },
        }),
      ).rejects.toThrow("Insufficient permissions to modify super_admin");
    });

    it("should prevent self role modification", async () => {
      const mockUser = { role: "admin" };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const { updateUserAction } = await import("./admin");

      await expect(
        updateUserAction({
          parsedInput: { id: "admin1", role: "user" },
          ctx: { user: { id: "admin1", role: "admin" } },
        }),
      ).rejects.toThrow("Cannot modify your own role");
    });
  });

  describe("cancelSubscriptionAction", () => {
    it("should cancel subscription successfully", async () => {
      const mockSubscription = {
        subscriptionId: "sub_123",
        userId: "user1",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      });

      mockCreemClient.cancelSubscription.mockResolvedValue({ success: true });

      const { cancelSubscriptionAction } = await import("./admin");

      const result = await cancelSubscriptionAction({
        parsedInput: { subscriptionId: "sub_123" },
      });

      expect(mockCreemClient.cancelSubscription).toHaveBeenCalledWith({
        xApiKey: mockEnv.CREEM_API_KEY,
        id: "sub_123",
      });
      expect(result).toEqual({
        success: true,
        message: "Subscription cancellation initiated.",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/subscriptions",
      );
    });

    it("should throw error when subscription not found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { cancelSubscriptionAction } = await import("./admin");

      await expect(
        cancelSubscriptionAction({
          parsedInput: { subscriptionId: "nonexistent" },
        }),
      ).rejects.toThrow("Subscription not found");
    });
  });

  describe("deleteUploadAction", () => {
    it("should delete upload successfully", async () => {
      const mockUpload = { fileKey: "files/test.jpg" };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUpload]),
          }),
        }),
      });

      mockDeleteFileFromR2.mockResolvedValue({ success: true });

      const { deleteUploadAction } = await import("./admin");

      const result = await deleteUploadAction({
        parsedInput: { uploadId: "upload1" },
      });

      expect(mockDeleteFileFromR2).toHaveBeenCalledWith("files/test.jpg");
      expect(result).toEqual({
        success: true,
        message: "Upload deleted successfully.",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/uploads",
      );
    });

    it("should throw error when upload not found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { deleteUploadAction } = await import("./admin");

      await expect(
        deleteUploadAction({
          parsedInput: { uploadId: "nonexistent" },
        }),
      ).rejects.toThrow("Upload not found");
    });
  });

  describe("batchDeleteUploadsAction", () => {
    it("should batch delete uploads successfully", async () => {
      const mockUploads = [
        { id: "upload1", fileKey: "files/test1.jpg" },
        { id: "upload2", fileKey: "files/test2.jpg" },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockUploads),
        }),
      });

      mockDeleteFilesFromR2.mockResolvedValue({ success: true });

      const { batchDeleteUploadsAction } = await import("./admin");

      const result = await batchDeleteUploadsAction({
        parsedInput: { uploadIds: ["upload1", "upload2"] },
      });

      expect(mockDeleteFilesFromR2).toHaveBeenCalledWith([
        "files/test1.jpg",
        "files/test2.jpg",
      ]);
      expect(result).toEqual({
        success: true,
        message: "Successfully deleted 2 file(s).",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/uploads",
      );
    });

    it("should throw error when no uploads found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const { batchDeleteUploadsAction } = await import("./admin");

      await expect(
        batchDeleteUploadsAction({
          parsedInput: { uploadIds: ["nonexistent"] },
        }),
      ).rejects.toThrow("No uploads found to delete.");
    });

    it("should throw error when R2 deletion fails", async () => {
      const mockUploads = [{ id: "upload1", fileKey: "files/test1.jpg" }];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockUploads),
        }),
      });

      mockDeleteFilesFromR2.mockResolvedValue({
        success: false,
        error: "R2 service unavailable",
      });

      const { batchDeleteUploadsAction } = await import("./admin");

      await expect(
        batchDeleteUploadsAction({
          parsedInput: { uploadIds: ["upload1"] },
        }),
      ).rejects.toThrow("R2 service unavailable");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle empty search results", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockIlike.mockReturnValue("ilike-condition");

      const { getUsers } = await import("./admin");

      // Test search functionality - this should cover line 192
      const result = await getUsers({ search: "nonexistent@example.com" });

      expect(mockOr).toHaveBeenCalled();
      expect(mockIlike).toHaveBeenCalledWith(
        expect.anything(),
        "%nonexistent@example.com%",
      );
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should handle pagination with large offset", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 1000 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getUsers } = await import("./admin");

      const result = await getUsers({ page: 100, limit: 10 });

      expect(mockQuery.offset).toHaveBeenCalledWith(990); // (100 - 1) * 10
      expect(result.pagination.total).toBe(1000);
      expect(result.pagination.totalPages).toBe(100);
    });

    it("should handle complex search with special characters", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockIlike.mockReturnValue("ilike-condition");

      const { getUsers } = await import("./admin");

      // Test search with special characters
      await getUsers({ search: "user@domain-with-special.chars_123" });

      expect(mockOr).toHaveBeenCalled();
      expect(mockIlike).toHaveBeenCalledWith(
        expect.anything(),
        "%user@domain-with-special.chars_123%",
      );
    });

    it("should handle all specific file type categories", async () => {
      const fileTypes = ["video", "audio", "pdf", "text", "archive"];

      for (const fileType of fileTypes) {
        const mockQuery = {
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue([]),
        };

        const mockTotalQuery = {
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ total: 0 }]),
        };

        mockDb.select
          .mockReturnValueOnce(mockQuery)
          .mockReturnValueOnce(mockTotalQuery);

        const { getUploads } = await import("./admin");

        await getUploads({ fileType });
      }

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle unknown file type gracefully", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getUploads } = await import("./admin");

      await getUploads({ fileType: "unknown-type" });

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle conditional where clause combinations in payments", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);

      const { getPayments } = await import("./admin");

      // Test with all conditions set
      await getPayments({
        search: "test",
        status: "succeeded",
        dateFrom: "2023-01-01",
        dateTo: "2023-12-31",
      });

      expect(mockGte).toHaveBeenCalled();
      expect(mockLte).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalled();
    });

    it("should handle payment filtering with multiple conditions", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockOr.mockReturnValue("search-condition");
      mockIlike.mockReturnValue("ilike-condition");

      const { getPayments } = await import("./admin");

      // Test payment search with paymentId search
      await getPayments({ search: "pay_123abc" });

      expect(mockIlike).toHaveBeenCalledWith(
        mockPayments.paymentId,
        "%pay_123abc%",
      );
      expect(mockOr).toHaveBeenCalled();
    });

    it("should handle file upload conditions with empty conditions array", async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      const mockTotalQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTotalQuery);
      mockAnd.mockReturnValue("and-condition");

      const { getUploads } = await import("./admin");

      // Test with no search and fileType "all" to test empty conditions
      await getUploads({ search: "", fileType: "all" });

      expect(mockQuery.where).toHaveBeenCalledWith(undefined);
    });
  });
});
