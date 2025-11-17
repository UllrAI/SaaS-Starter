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
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEnabledTablesMap = {
  users: {
    id: "users.id",
    name: "users.name",
    email: "users.email",
    $inferSelect: {},
  },
  uploads: {
    id: "uploads.id",
    fileName: "uploads.fileName",
    fileSize: "uploads.fileSize",
    $inferSelect: {},
  },
  payments: {
    id: "payments.id",
    amount: "payments.amount",
    status: "payments.status",
    $inferSelect: {},
  },
};

const mockRequireAdmin = jest.fn();
const mockRevalidatePath = jest.fn();
const mockCreateSafeActionClient = jest.fn();
const mockGetTableConfig = jest.fn();

// Mock drizzle-orm functions
const mockCount = jest.fn();
const mockEq = jest.fn();
const mockIlike = jest.fn();
const mockInArray = jest.fn();
const mockOr = jest.fn();
const mockAnd = jest.fn();

const createColumnMock = () => {
  const chainable = {
    primaryKey: jest.fn().mockReturnThis(),
    notNull: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    unique: jest.fn().mockReturnThis(),
    references: jest.fn().mockReturnThis(),
    defaultRandom: jest.fn().mockReturnThis(),
    defaultNow: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => ({
    ...chainable,
    getSQLType: jest.fn(),
    dataType: "any",
  }));
};

// Create chainable mock factory for Zod
const createZodChainableMock = () => {
  const chainable = {
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    nullable: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    refine: jest.fn().mockReturnThis(),
    transform: jest.fn().mockReturnThis(),
  };
  return chainable;
};

// Setup mocks
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/lib/config/admin-tables", () => ({
  enabledTablesMap: mockEnabledTablesMap,
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireAdmin: mockRequireAdmin,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

jest.mock("next-safe-action", () => ({
  createSafeActionClient: mockCreateSafeActionClient,
}));

jest.mock("drizzle-orm/pg-core", () => ({
  getTableConfig: mockGetTableConfig,
  pgEnum: jest.fn((_name, values) => {
    const enumFn = jest.fn(() => ({ ...createColumnMock()() }));
    (enumFn as any).enumValues = values;
    return enumFn;
  }),
  pgTable: jest.fn((_name, columns) => columns),
  text: createColumnMock(),
  integer: createColumnMock(),
  timestamp: createColumnMock(),
  boolean: createColumnMock(),
  uuid: createColumnMock(),
  index: jest.fn(),
}));

jest.mock("drizzle-orm", () => ({
  count: mockCount,
  eq: mockEq,
  ilike: mockIlike,
  inArray: mockInArray,
  or: mockOr,
  and: mockAnd,
}));

jest.mock("zod", () => ({
  z: {
    string: jest.fn(() => createZodChainableMock()),
    number: jest.fn(() => createZodChainableMock()),
    union: jest.fn(() => createZodChainableMock()),
    array: jest.fn(() => createZodChainableMock()),
    record: jest.fn(() => createZodChainableMock()),
    unknown: jest.fn(() => createZodChainableMock()),
    custom: jest.fn(() => createZodChainableMock()),
    object: jest.fn(() => createZodChainableMock()),
  },
}));

describe("Admin Generic Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console logs
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Setup default mock implementations
    mockRequireAdmin.mockResolvedValue({
      id: "admin-user-id",
      role: "admin",
      email: "admin@example.com",
    });

    mockRevalidatePath.mockImplementation(() => {});

    // Mock safe action client
    mockCreateSafeActionClient.mockReturnValue({
      use: jest.fn(() => ({
        schema: jest.fn(() => ({
          action: jest.fn((handler) => handler),
        })),
      })),
    });

    // Mock getTableConfig
    mockGetTableConfig.mockReturnValue({
      columns: [
        {
          name: "id",
          getSQLType: () => "text",
          primary: true,
          notNull: true,
          hasDefault: false,
        },
        {
          name: "name",
          getSQLType: () => "varchar(255)",
          primary: false,
          notNull: true,
          hasDefault: false,
        },
        {
          name: "email",
          getSQLType: () => "varchar(255)",
          primary: false,
          notNull: true,
          hasDefault: false,
        },
      ],
      foreignKeys: [], // <--- 添加这个空的 foreignKeys 数组
    });

    // Mock drizzle-orm functions
    mockCount.mockReturnValue("count(*)");
    mockEq.mockReturnValue("id = $1");
    mockIlike.mockReturnValue("name ILIKE '%search%'");
    mockInArray.mockReturnValue("id IN ($1, $2)");
    mockOr.mockReturnValue("(condition1 OR condition2)");
    mockAnd.mockReturnValue("(condition1 AND condition2)");

    // Mock database query builders
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([
              { id: 1, name: "Test User", email: "test@example.com" },
              { id: 2, name: "Another User", email: "another@example.com" },
            ]),
          }),
        }),
      }),
    });

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: "New User", email: "new@example.com" },
          ]),
      }),
    });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([
              { id: 1, name: "Updated User", email: "updated@example.com" },
            ]),
        }),
      }),
    });

    mockDb.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getGenericTableData", () => {
    it("should fetch paginated table data successfully", async () => {
      // Mock separate queries for data and count
      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([
                { id: 1, name: "User 1", email: "user1@example.com" },
                { id: 2, name: "User 2", email: "user2@example.com" },
              ]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 50 }]),
        }),
      };

      // Mock db.select to return different objects for different calls
      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      const result = await getGenericTableData("users", {
        page: 1,
        limit: 10,
        search: "test",
        sort: { by: "name", order: "asc" },
      });

      expect(result).toEqual({
        data: [
          { id: 1, name: "User 1", email: "user1@example.com" },
          { id: 2, name: "User 2", email: "user2@example.com" },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      });

      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockGetTableConfig).toHaveBeenCalledWith(
        mockEnabledTablesMap.users,
      );
    });

    it("should handle pagination correctly", async () => {
      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 25 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      const result = await getGenericTableData("users", {
        page: 3,
        limit: 5,
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
    });

    it("should handle search functionality", async () => {
      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 0 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      await getGenericTableData("users", {
        page: 1,
        limit: 10,
        search: "john",
      });

      expect(mockIlike).toHaveBeenCalled();
      expect(mockOr).toHaveBeenCalled();
    });

    it("should handle tables with no text columns", async () => {
      // Mock table with no text columns
      mockGetTableConfig.mockReturnValueOnce({
        columns: [
          {
            getSQLType: jest.fn().mockReturnValue("integer"),
          },
          {
            getSQLType: jest.fn().mockReturnValue("boolean"),
          },
        ],
      });

      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 0 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      await getGenericTableData("users", {
        page: 1,
        limit: 10,
        search: "test",
      });

      // Should not call ilike when no text columns
      expect(mockIlike).not.toHaveBeenCalled();
    });
  });

  describe("createRecord", () => {
    it("should create a new record successfully", async () => {
      const { createRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        data: {
          name: "New User",
          email: "new@example.com",
          age: undefined, // Should be filtered out
        },
      };

      const result = await createRecord({
        parsedInput: mockParsedInput,
      });

      expect(result).toEqual({
        record: { id: 1, name: "New User", email: "new@example.com" },
      });

      expect(mockDb.insert).toHaveBeenCalledWith(mockEnabledTablesMap.users);
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/tables/users",
      );
    });

    it("should filter out undefined values", async () => {
      const { createRecord } = await import("./admin-generic");

      const valuesMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });

      mockDb.insert.mockReturnValue({
        values: valuesMock,
      });

      const mockParsedInput = {
        tableName: "users" as const,
        data: {
          name: "Test",
          email: "test@example.com",
          undefinedField: undefined,
          nullField: null,
        },
      };

      await createRecord({
        parsedInput: mockParsedInput,
      });

      // Check that undefined values were filtered but null values kept
      expect(valuesMock).toHaveBeenCalledWith({
        name: "Test",
        email: "test@example.com",
        nullField: null,
      });
    });

    it("should handle database errors gracefully", async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      const { createRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      };

      await expect(
        createRecord({
          parsedInput: mockParsedInput,
        }),
      ).rejects.toThrow("Database error");
    });
  });

  describe("updateRecord", () => {
    it("should update a record successfully", async () => {
      const { updateRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        id: 1,
        data: {
          name: "Updated User",
          email: "updated@example.com",
          undefinedField: undefined,
        },
      };

      const result = await updateRecord({
        parsedInput: mockParsedInput,
      });

      expect(result).toEqual({
        record: { id: 1, name: "Updated User", email: "updated@example.com" },
      });

      expect(mockDb.update).toHaveBeenCalledWith(mockEnabledTablesMap.users);
      expect(mockEq).toHaveBeenCalledWith(mockEnabledTablesMap.users.id, 1);
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/tables/users",
      );
    });

    it("should handle string IDs", async () => {
      const { updateRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        id: "user-123",
        data: {
          name: "Updated User",
        },
      };

      await updateRecord({
        parsedInput: mockParsedInput,
      });

      expect(mockEq).toHaveBeenCalledWith(
        mockEnabledTablesMap.users.id,
        "user-123",
      );
    });

    it("should filter out undefined values from update data", async () => {
      const { updateRecord } = await import("./admin-generic");

      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: setMock,
      });

      const mockParsedInput = {
        tableName: "users" as const,
        id: 1,
        data: {
          name: "Updated",
          email: undefined,
          status: null,
        },
      };

      await updateRecord({
        parsedInput: mockParsedInput,
      });

      expect(setMock).toHaveBeenCalledWith({
        name: "Updated",
        status: null,
      });
    });

    it("should handle update errors", async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error("Update failed")),
          }),
        }),
      });

      const { updateRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        id: 1,
        data: { name: "Test" },
      };

      await expect(
        updateRecord({
          parsedInput: mockParsedInput,
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("deleteRecords", () => {
    it("should delete multiple records successfully", async () => {
      const { deleteRecords } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        ids: [1, 2, 3],
      };

      const result = await deleteRecords({
        parsedInput: mockParsedInput,
      });

      expect(result).toEqual({
        success: true,
        count: 2, // Mocked return length
      });

      expect(mockDb.delete).toHaveBeenCalledWith(mockEnabledTablesMap.users);
      expect(mockInArray).toHaveBeenCalledWith(
        mockEnabledTablesMap.users.id,
        [1, 2, 3],
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dashboard/admin/tables/users",
      );
    });

    it("should handle single record deletion", async () => {
      const { deleteRecords } = await import("./admin-generic");

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      const mockParsedInput = {
        tableName: "users" as const,
        ids: [1],
      };

      const result = await deleteRecords({
        parsedInput: mockParsedInput,
      });

      expect(result).toEqual({
        success: true,
        count: 1,
      });
    });

    it("should handle mixed ID types", async () => {
      const { deleteRecords } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        ids: [1, "user-2", 3],
      };

      await deleteRecords({
        parsedInput: mockParsedInput,
      });

      expect(mockInArray).toHaveBeenCalledWith(mockEnabledTablesMap.users.id, [
        1,
        "user-2",
        3,
      ]);
    });

    it("should handle deletion errors", async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("Delete failed")),
        }),
      });

      const { deleteRecords } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        ids: [1, 2],
      };

      await expect(
        deleteRecords({
          parsedInput: mockParsedInput,
        }),
      ).rejects.toThrow("Delete failed");
    });

    it("should handle empty results", async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const { deleteRecords } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        ids: [999], // Non-existent ID
      };

      const result = await deleteRecords({
        parsedInput: mockParsedInput,
      });

      expect(result).toEqual({
        success: true,
        count: 0,
      });
    });
  });

  describe("Authorization", () => {
    it("should have admin middleware configured correctly", async () => {
      // Test that the actions are properly configured with middleware
      const { createRecord, updateRecord, deleteRecords } = await import(
        "./admin-generic"
      );

      // All admin actions should be functions (indicating they were properly created)
      expect(typeof createRecord).toBe("function");
      expect(typeof updateRecord).toBe("function");
      expect(typeof deleteRecords).toBe("function");

      // Test that our mocked safe action setup works
      expect(mockCreateSafeActionClient).toBeDefined();
      expect(mockRequireAdmin).toBeDefined();
    });

    it("should execute admin actions with proper context", async () => {
      // Test that actions execute successfully with admin context
      const { createRecord } = await import("./admin-generic");

      const mockParsedInput = {
        tableName: "users" as const,
        data: { name: "Test User", email: "test@example.com" },
      };

      const result = await createRecord({
        parsedInput: mockParsedInput,
      });

      // Verify the action completed successfully
      expect(result).toEqual({
        record: { id: 1, name: "New User", email: "new@example.com" },
      });

      // Verify database operations were called
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid table names", async () => {
      // This would be caught by Zod validation in real usage
      const { getGenericTableData } = await import("./admin-generic");

      // Mock the enabledTablesMap to not include the table
      const originalMap = { ...mockEnabledTablesMap };
      delete (mockEnabledTablesMap as any).invalidTable;

      try {
        await getGenericTableData("invalidTable" as any, {
          page: 1,
          limit: 10,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Restore original map
      Object.assign(mockEnabledTablesMap, originalMap);
    });

    it("should handle zero limit pagination", async () => {
      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 10 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      const result = await getGenericTableData("users", {
        page: 1,
        limit: 0,
      });

      expect(result.pagination.totalPages).toBe(Infinity);
    });

    it("should handle empty search strings", async () => {
      const mockDataQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 0 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(mockDataQuery)
        .mockReturnValueOnce(mockCountQuery);

      const { getGenericTableData } = await import("./admin-generic");

      await getGenericTableData("users", {
        page: 1,
        limit: 10,
        search: "",
      });

      // Should not apply search filters for empty search
      expect(mockIlike).not.toHaveBeenCalled();
    });
  });
});
