import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock all external dependencies
const mockDb = {
  select: jest.fn(),
};

const mockFormatFileSize = jest.fn();
const mockConsoleError = jest.fn();

// Mock drizzle-orm functions
const mockCount = jest.fn();
const mockSum = jest.fn();
const mockDesc = jest.fn();
const mockEq = jest.fn();
const mockInArray = jest.fn();
const mockGte = jest.fn();

// Mock database tables
const mockUsers = {
  emailVerified: "users.email_verified",
  role: "users.role",
  createdAt: "users.created_at",
};

const mockSubscriptions = {
  status: "subscriptions.status",
};

const mockPayments = {
  amount: "payments.amount",
  status: "payments.status",
  createdAt: "payments.created_at",
};

const mockUploads = {
  fileSize: "uploads.file_size",
  contentType: "uploads.content_type",
  createdAt: "uploads.created_at",
};

// Setup mocks
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  users: mockUsers,
  subscriptions: mockSubscriptions,
  payments: mockPayments,
  uploads: mockUploads,
}));

jest.mock("@/app/dashboard/admin/_components/admin-stats-cards", () => ({
  AdminStats: {},
}));

jest.mock("@/lib/config/upload", () => ({
  formatFileSize: mockFormatFileSize,
}));

jest.mock("drizzle-orm", () => ({
  count: mockCount,
  sum: mockSum,
  desc: mockDesc,
  eq: mockEq,
  inArray: mockInArray,
  gte: mockGte,
}));

describe("Admin Stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console logs
    jest.spyOn(console, "error").mockImplementation(mockConsoleError);

    // Setup default mock implementations
    mockCount.mockReturnValue("count(*)");
    mockSum.mockReturnValue("sum(amount)");
    mockDesc.mockReturnValue("ORDER BY created_at DESC");
    mockEq.mockReturnValue("column = value");
    mockInArray.mockReturnValue("column IN (values)");
    mockGte.mockReturnValue("column >= value");
    mockFormatFileSize.mockImplementation((size) => `${size} B`);

    // Mock default database responses
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue([]),
          limit: jest.fn().mockReturnValue([]),
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue([]),
            }),
          }),
        }),
        orderBy: jest.fn().mockReturnValue([]),
        groupBy: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue([]),
          }),
        }),
      }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getUserStats", () => {
    it("should fetch user statistics successfully", async () => {
      // Mock database responses for user stats
      const mockUserTotal = {
        from: jest.fn().mockResolvedValue([{ value: 150 }]),
      };
      const mockUserVerified = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 120 }]),
        }),
      };
      const mockUserAdmins = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 5 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockUserTotal)
        .mockReturnValueOnce(mockUserVerified)
        .mockReturnValueOnce(mockUserAdmins);

      const { getUserStats } = await import("./stats");

      const result = await getUserStats();

      expect(result).toEqual({
        total: 150,
        verified: 120,
        admins: 5,
      });

      expect(mockDb.select).toHaveBeenCalledTimes(3);
      expect(mockCount).toHaveBeenCalledTimes(3);
      expect(mockEq).toHaveBeenCalledWith(mockUsers.emailVerified, true);
      expect(mockInArray).toHaveBeenCalledWith(mockUsers.role, [
        "admin",
        "super_admin",
      ]);
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Database error");
      });

      const { getUserStats } = await import("./stats");

      const result = await getUserStats();

      expect(result).toEqual({
        total: 0,
        verified: 0,
        admins: 0,
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching user stats:",
        expect.any(Error),
      );
    });

    it("should handle null/undefined database responses", async () => {
      const mockEmptyResponse = { from: jest.fn().mockResolvedValue([]) };

      mockDb.select
        .mockReturnValueOnce(mockEmptyResponse)
        .mockReturnValueOnce(mockEmptyResponse)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const { getUserStats } = await import("./stats");

      const result = await getUserStats();

      expect(result).toEqual({
        total: 0,
        verified: 0,
        admins: 0,
      });
    });
  });

  describe("getSubscriptionStats", () => {
    it("should fetch subscription statistics successfully", async () => {
      const mockSubTotal = {
        from: jest.fn().mockResolvedValue([{ value: 85 }]),
      };
      const mockSubActive = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 65 }]),
        }),
      };
      const mockSubCanceled = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 20 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockSubTotal)
        .mockReturnValueOnce(mockSubActive)
        .mockReturnValueOnce(mockSubCanceled);

      const { getSubscriptionStats } = await import("./stats");

      const result = await getSubscriptionStats();

      expect(result).toEqual({
        total: 85,
        active: 65,
        canceled: 20,
      });

      expect(mockEq).toHaveBeenCalledWith(mockSubscriptions.status, "active");
      expect(mockEq).toHaveBeenCalledWith(mockSubscriptions.status, "canceled");
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Subscription query error");
      });

      const { getSubscriptionStats } = await import("./stats");

      const result = await getSubscriptionStats();

      expect(result).toEqual({
        total: 0,
        active: 0,
        canceled: 0,
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching subscription stats:",
        expect.any(Error),
      );
    });
  });

  describe("getPaymentStats", () => {
    it("should fetch payment statistics successfully", async () => {
      const mockPayTotal = {
        from: jest.fn().mockResolvedValue([{ value: 342 }]),
      };
      const mockPayRevenue = {
        from: jest.fn().mockResolvedValue([{ value: "125000" }]),
      };
      const mockPaySuccessful = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 298 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockPayTotal)
        .mockReturnValueOnce(mockPayRevenue)
        .mockReturnValueOnce(mockPaySuccessful);

      const { getPaymentStats } = await import("./stats");

      const result = await getPaymentStats();

      expect(result).toEqual({
        total: 342,
        totalRevenue: 125000,
        successful: 298,
      });

      expect(mockSum).toHaveBeenCalledWith(mockPayments.amount);
      expect(mockEq).toHaveBeenCalledWith(mockPayments.status, "succeeded");
    });

    it("should handle null revenue values", async () => {
      const mockPayTotal = {
        from: jest.fn().mockResolvedValue([{ value: 10 }]),
      };
      const mockPayRevenue = {
        from: jest.fn().mockResolvedValue([{ value: null }]),
      };
      const mockPaySuccessful = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ value: 8 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockPayTotal)
        .mockReturnValueOnce(mockPayRevenue)
        .mockReturnValueOnce(mockPaySuccessful);

      const { getPaymentStats } = await import("./stats");

      const result = await getPaymentStats();

      expect(result).toEqual({
        total: 10,
        totalRevenue: 0,
        successful: 8,
      });
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Payment query error");
      });

      const { getPaymentStats } = await import("./stats");

      const result = await getPaymentStats();

      expect(result).toEqual({
        total: 0,
        totalRevenue: 0,
        successful: 0,
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching payment stats:",
        expect.any(Error),
      );
    });
  });

  describe("getUploadStats", () => {
    it("should fetch upload statistics successfully", async () => {
      const mockUploadTotal = {
        from: jest.fn().mockResolvedValue([{ value: 456 }]),
      };
      const mockUploadSize = {
        from: jest.fn().mockResolvedValue([{ value: "1073741824" }]),
      }; // 1GB

      mockDb.select
        .mockReturnValueOnce(mockUploadTotal)
        .mockReturnValueOnce(mockUploadSize);

      const { getUploadStats } = await import("./stats");

      const result = await getUploadStats();

      expect(result).toEqual({
        total: 456,
        totalSize: 1073741824,
      });

      expect(mockSum).toHaveBeenCalledWith(mockUploads.fileSize);
    });

    it("should handle null size values", async () => {
      const mockUploadTotal = {
        from: jest.fn().mockResolvedValue([{ value: 25 }]),
      };
      const mockUploadSize = {
        from: jest.fn().mockResolvedValue([{ value: null }]),
      };

      mockDb.select
        .mockReturnValueOnce(mockUploadTotal)
        .mockReturnValueOnce(mockUploadSize);

      const { getUploadStats } = await import("./stats");

      const result = await getUploadStats();

      expect(result).toEqual({
        total: 25,
        totalSize: 0,
      });
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Upload query error");
      });

      const { getUploadStats } = await import("./stats");

      const result = await getUploadStats();

      expect(result).toEqual({
        total: 0,
        totalSize: 0,
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching upload stats:",
        expect.any(Error),
      );
    });
  });

  describe("getAdminStats", () => {
    it("should combine all stats successfully", async () => {
      // Mock individual stat functions
      const mockUserStats = { total: 100, verified: 80, admins: 5 };
      const mockSubStats = { total: 50, active: 40, canceled: 10 };
      const mockPayStats = { total: 200, totalRevenue: 50000, successful: 180 };
      const mockUploadStats = { total: 300, totalSize: 2000000000 };

      // Setup complex mocking for multiple parallel calls
      const mockQueries = [
        { from: jest.fn().mockResolvedValue([{ value: 100 }]) }, // user total
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 80 }]),
          }),
        }, // user verified
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 5 }]),
          }),
        }, // user admins
        { from: jest.fn().mockResolvedValue([{ value: 50 }]) }, // sub total
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 40 }]),
          }),
        }, // sub active
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 10 }]),
          }),
        }, // sub canceled
        { from: jest.fn().mockResolvedValue([{ value: 200 }]) }, // pay total
        { from: jest.fn().mockResolvedValue([{ value: "50000" }]) }, // pay revenue
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 180 }]),
          }),
        }, // pay successful
        { from: jest.fn().mockResolvedValue([{ value: 300 }]) }, // upload total
        { from: jest.fn().mockResolvedValue([{ value: "2000000000" }]) }, // upload size
      ];

      mockDb.select.mockImplementation(() => mockQueries.shift());

      const { getAdminStats } = await import("./stats");

      const result = await getAdminStats();

      expect(result).toEqual({
        users: mockUserStats,
        subscriptions: mockSubStats,
        payments: mockPayStats,
        uploads: mockUploadStats,
      });
    });

    it("should handle errors and return default structure", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Combined stats error");
      });

      const { getAdminStats } = await import("./stats");

      const result = await getAdminStats();

      expect(result).toEqual({
        users: { total: 0, verified: 0, admins: 0 },
        subscriptions: { total: 0, active: 0, canceled: 0 },
        payments: { total: 0, totalRevenue: 0, successful: 0 },
        uploads: { total: 0, totalSize: 0 },
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching user stats:",
        expect.any(Error),
      );
    });
  });

  describe("getAdminStatsWithCharts", () => {
    it("should fetch stats with chart data successfully", async () => {
      const now = new Date();
      const mockUsers = [
        { createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) }, // 1 day ago
        { createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2) }, // 2 days ago
        { createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) }, // 1 day ago (duplicate date)
      ];

      const mockPayments = [
        {
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
          amount: 1000,
        }, // 1 month ago
        {
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60),
          amount: 2000,
        }, // 2 months ago
        {
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
          amount: 1500,
        }, // 1 month ago (same month)
      ];

      // Mock basic stats calls (first 11 calls)
      const mockBasicStatsQueries = [
        { from: jest.fn().mockResolvedValue([{ value: 100 }]) }, // user total
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 80 }]),
          }),
        }, // user verified
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 5 }]),
          }),
        }, // user admins
        { from: jest.fn().mockResolvedValue([{ value: 50 }]) }, // sub total
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 40 }]),
          }),
        }, // sub active
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 10 }]),
          }),
        }, // sub canceled
        { from: jest.fn().mockResolvedValue([{ value: 200 }]) }, // pay total
        { from: jest.fn().mockResolvedValue([{ value: "50000" }]) }, // pay revenue
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 180 }]),
          }),
        }, // pay successful
        { from: jest.fn().mockResolvedValue([{ value: 300 }]) }, // upload total
        { from: jest.fn().mockResolvedValue([{ value: "2000000000" }]) }, // upload size
        // Chart data queries
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        },
        {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        },
      ];

      mockDb.select.mockImplementation(() => mockBasicStatsQueries.shift());

      const { getAdminStatsWithCharts } = await import("./stats");

      const result = await getAdminStatsWithCharts();

      expect(result).toHaveProperty("users");
      expect(result).toHaveProperty("subscriptions");
      expect(result).toHaveProperty("payments");
      expect(result).toHaveProperty("uploads");
      expect(result).toHaveProperty("charts");
      expect(result.charts).toHaveProperty("recentUsers");
      expect(result.charts).toHaveProperty("monthlyRevenue");

      // Test that chart data is processed correctly
      expect(Array.isArray(result.charts.recentUsers)).toBe(true);
      expect(Array.isArray(result.charts.monthlyRevenue)).toBe(true);
    });

    it("should handle chart data errors gracefully", async () => {
      // Simplify by just throwing error immediately
      mockDb.select.mockImplementation(() => {
        throw new Error("Chart error");
      });

      const { getAdminStatsWithCharts } = await import("./stats");

      const result = await getAdminStatsWithCharts();

      expect(result.charts).toEqual({
        recentUsers: [],
        monthlyRevenue: [],
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching admin stats with charts:",
        expect.any(Error),
      );
    });
  });

  describe("getUploadStatsDetails", () => {
    it("should fetch detailed upload statistics successfully", async () => {
      const mockBasicStats = [{ total: 100, totalSize: "5000000" }];
      const mockRecentStats = [{ recentUploads: 15 }];
      const mockFileTypeStats = [
        { contentType: "image/jpeg", count: 40 },
        { contentType: "image/png", count: 25 },
        { contentType: "video/mp4", count: 15 },
        { contentType: "application/pdf", count: 10 },
        { contentType: "text/plain", count: 5 },
        { contentType: "application/zip", count: 3 },
        { contentType: "audio/mp3", count: 2 },
      ];

      const mockBasicQuery = {
        from: jest.fn().mockResolvedValue(mockBasicStats),
      };
      const mockRecentQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRecentStats),
        }),
      };
      const mockFileTypeQuery = {
        from: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockFileTypeStats),
            }),
          }),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockBasicQuery)
        .mockReturnValueOnce(mockRecentQuery)
        .mockReturnValueOnce(mockFileTypeQuery);

      mockFormatFileSize
        .mockReturnValueOnce("5.0 MB") // total size
        .mockReturnValueOnce("50.0 KB"); // average size

      const { getUploadStatsDetails } = await import("./stats");

      const result = await getUploadStatsDetails();

      expect(result).toEqual({
        total: 100,
        totalSize: 5000000,
        totalSizeFormatted: "5.0 MB",
        averageSize: 50000,
        averageSizeFormatted: "50.0 KB",
        topFileTypes: [
          { type: "Image", count: 65, percentage: 65 },
          { type: "Video", count: 15, percentage: 15 },
          { type: "PDF", count: 10, percentage: 10 },
          { type: "Text", count: 5, percentage: 5 },
          { type: "Archive", count: 3, percentage: 3 },
          { type: "Audio", count: 2, percentage: 2 },
        ],
        recentUploads: 15,
      });

      expect(mockFormatFileSize).toHaveBeenCalledWith(5000000);
      expect(mockFormatFileSize).toHaveBeenCalledWith(50000);
    });

    it("should handle empty upload data", async () => {
      const mockBasicStats = [{ total: 0, totalSize: "0" }];
      const mockRecentStats = [{ recentUploads: 0 }];
      const mockFileTypeStats: any[] = [];

      const mockBasicQuery = {
        from: jest.fn().mockResolvedValue(mockBasicStats),
      };
      const mockRecentQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRecentStats),
        }),
      };
      const mockFileTypeQuery = {
        from: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockFileTypeStats),
            }),
          }),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockBasicQuery)
        .mockReturnValueOnce(mockRecentQuery)
        .mockReturnValueOnce(mockFileTypeQuery);

      mockFormatFileSize.mockReturnValue("0 B");

      const { getUploadStatsDetails } = await import("./stats");

      const result = await getUploadStatsDetails();

      expect(result).toEqual({
        total: 0,
        totalSize: 0,
        totalSizeFormatted: "0 B",
        averageSize: 0,
        averageSizeFormatted: "0 B",
        topFileTypes: [],
        recentUploads: 0,
      });
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Upload details error");
      });

      const { getUploadStatsDetails } = await import("./stats");

      const result = await getUploadStatsDetails();

      expect(result).toEqual({
        total: 0,
        totalSize: 0,
        totalSizeFormatted: "0 B",
        averageSize: 0,
        averageSizeFormatted: "0 B",
        topFileTypes: [],
        recentUploads: 0,
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error fetching upload stats details:",
        expect.any(Error),
      );
    });

    it("should categorize file types correctly", async () => {
      const mockFileTypeStats = [
        { contentType: "image/jpeg", count: 10 },
        { contentType: "video/mp4", count: 8 },
        { contentType: "audio/wav", count: 6 },
        { contentType: "application/pdf", count: 4 },
        { contentType: "text/plain", count: 3 },
        { contentType: "application/zip", count: 2 },
        { contentType: "application/vnd.rar", count: 1 },
        { contentType: "application/unknown", count: 1 },
      ];

      const mockBasicQuery = {
        from: jest.fn().mockResolvedValue([{ total: 35, totalSize: "100000" }]),
      };
      const mockRecentQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ recentUploads: 5 }]),
        }),
      };
      const mockFileTypeQuery = {
        from: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockFileTypeStats),
            }),
          }),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockBasicQuery)
        .mockReturnValueOnce(mockRecentQuery)
        .mockReturnValueOnce(mockFileTypeQuery);

      mockFormatFileSize.mockReturnValue("100 KB");

      const { getUploadStatsDetails } = await import("./stats");

      const result = await getUploadStatsDetails();

      expect(result.topFileTypes).toEqual([
        { type: "Image", count: 10, percentage: 29 },
        { type: "Video", count: 8, percentage: 23 },
        { type: "Audio", count: 6, percentage: 17 },
        { type: "PDF", count: 4, percentage: 11 },
        { type: "Text", count: 3, percentage: 9 },
        { type: "Archive", count: 3, percentage: 9 },
        { type: "Other", count: 1, percentage: 3 },
      ]);
    });
  });
});
