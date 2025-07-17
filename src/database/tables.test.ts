import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock the schema module since we're testing the barrel export
jest.mock("./schema", () => ({
  accounts: { name: "accounts", __type: "table" },
  sessions: { name: "sessions", __type: "table" },
  users: { name: "users", __type: "table" },
  verifications: { name: "verifications", __type: "table" },
  subscriptions: { name: "subscriptions", __type: "table" },
  payments: { name: "payments", __type: "table" },
  webhookEvents: { name: "webhookEvents", __type: "table" },
  uploads: { name: "uploads", __type: "table" },
  userRoleEnum: {
    name: "userRoleEnum",
    __type: "enum",
    enumValues: ["user", "admin", "super_admin"],
  },
}));

describe("database/tables", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("module imports and exports", () => {
    it("should import all required entities from schema", () => {
      const schema = require("./schema");

      // Verify all expected entities exist in schema
      expect(schema.accounts).toBeDefined();
      expect(schema.sessions).toBeDefined();
      expect(schema.users).toBeDefined();
      expect(schema.verifications).toBeDefined();
      expect(schema.subscriptions).toBeDefined();
      expect(schema.payments).toBeDefined();
      expect(schema.webhookEvents).toBeDefined();
      expect(schema.uploads).toBeDefined();
      expect(schema.userRoleEnum).toBeDefined();
    });

    it("should re-export all entities from schema", () => {
      const tables = require("./tables");

      // Verify all entities are re-exported
      expect(tables.accounts).toBeDefined();
      expect(tables.sessions).toBeDefined();
      expect(tables.users).toBeDefined();
      expect(tables.verifications).toBeDefined();
      expect(tables.subscriptions).toBeDefined();
      expect(tables.payments).toBeDefined();
      expect(tables.webhookEvents).toBeDefined();
      expect(tables.uploads).toBeDefined();
      expect(tables.userRoleEnum).toBeDefined();
    });

    it("should export the same objects as imported from schema", () => {
      const schema = require("./schema");
      const tables = require("./tables");

      // Verify exports match imports
      expect(tables.accounts).toBe(schema.accounts);
      expect(tables.sessions).toBe(schema.sessions);
      expect(tables.users).toBe(schema.users);
      expect(tables.verifications).toBe(schema.verifications);
      expect(tables.subscriptions).toBe(schema.subscriptions);
      expect(tables.payments).toBe(schema.payments);
      expect(tables.webhookEvents).toBe(schema.webhookEvents);
      expect(tables.uploads).toBe(schema.uploads);
      expect(tables.userRoleEnum).toBe(schema.userRoleEnum);
    });
  });

  describe("table exports", () => {
    it("should export accounts table", () => {
      const { accounts } = require("./tables");

      expect(accounts).toBeDefined();
      expect(accounts.name).toBe("accounts");
      expect(accounts.__type).toBe("table");
    });

    it("should export sessions table", () => {
      const { sessions } = require("./tables");

      expect(sessions).toBeDefined();
      expect(sessions.name).toBe("sessions");
      expect(sessions.__type).toBe("table");
    });

    it("should export users table", () => {
      const { users } = require("./tables");

      expect(users).toBeDefined();
      expect(users.name).toBe("users");
      expect(users.__type).toBe("table");
    });

    it("should export verifications table", () => {
      const { verifications } = require("./tables");

      expect(verifications).toBeDefined();
      expect(verifications.name).toBe("verifications");
      expect(verifications.__type).toBe("table");
    });

    it("should export subscriptions table", () => {
      const { subscriptions } = require("./tables");

      expect(subscriptions).toBeDefined();
      expect(subscriptions.name).toBe("subscriptions");
      expect(subscriptions.__type).toBe("table");
    });

    it("should export payments table", () => {
      const { payments } = require("./tables");

      expect(payments).toBeDefined();
      expect(payments.name).toBe("payments");
      expect(payments.__type).toBe("table");
    });

    it("should export webhookEvents table", () => {
      const { webhookEvents } = require("./tables");

      expect(webhookEvents).toBeDefined();
      expect(webhookEvents.name).toBe("webhookEvents");
      expect(webhookEvents.__type).toBe("table");
    });

    it("should export uploads table", () => {
      const { uploads } = require("./tables");

      expect(uploads).toBeDefined();
      expect(uploads.name).toBe("uploads");
      expect(uploads.__type).toBe("table");
    });
  });

  describe("enum exports", () => {
    it("should export userRoleEnum", () => {
      const { userRoleEnum } = require("./tables");

      expect(userRoleEnum).toBeDefined();
      expect(userRoleEnum.name).toBe("userRoleEnum");
      expect(userRoleEnum.__type).toBe("enum");
      expect(userRoleEnum.enumValues).toEqual(["user", "admin", "super_admin"]);
    });
  });

  describe("module structure", () => {
    it("should export all expected properties", () => {
      const tables = require("./tables");

      const expectedExports = [
        "accounts",
        "sessions",
        "users",
        "verifications",
        "subscriptions",
        "payments",
        "webhookEvents",
        "uploads",
        "userRoleEnum",
      ];

      expectedExports.forEach((exportName) => {
        expect(tables).toHaveProperty(exportName);
      });
    });

    it("should not export any unexpected properties", () => {
      const tables = require("./tables");

      const expectedExports = [
        "accounts",
        "sessions",
        "users",
        "verifications",
        "subscriptions",
        "payments",
        "webhookEvents",
        "uploads",
        "userRoleEnum",
      ];

      const actualExports = Object.keys(tables);
      expect(actualExports.sort()).toEqual(expectedExports.sort());
    });

    it("should have correct count of exports", () => {
      const tables = require("./tables");

      // Should export exactly 9 entities (8 tables + 1 enum)
      expect(Object.keys(tables)).toHaveLength(9);
    });
  });

  describe("destructuring imports", () => {
    it("should support destructuring individual tables", () => {
      const { users, accounts, sessions } = require("./tables");

      expect(users).toBeDefined();
      expect(accounts).toBeDefined();
      expect(sessions).toBeDefined();
    });

    it("should support destructuring all tables at once", () => {
      const {
        accounts,
        sessions,
        users,
        verifications,
        subscriptions,
        payments,
        webhookEvents,
        uploads,
        userRoleEnum,
      } = require("./tables");

      expect(accounts).toBeDefined();
      expect(sessions).toBeDefined();
      expect(users).toBeDefined();
      expect(verifications).toBeDefined();
      expect(subscriptions).toBeDefined();
      expect(payments).toBeDefined();
      expect(webhookEvents).toBeDefined();
      expect(uploads).toBeDefined();
      expect(userRoleEnum).toBeDefined();
    });

    it("should support mixed destructuring with tables and enum", () => {
      const { users, userRoleEnum, payments } = require("./tables");

      expect(users.__type).toBe("table");
      expect(userRoleEnum.__type).toBe("enum");
      expect(payments.__type).toBe("table");
    });
  });

  describe("module loading", () => {
    it("should load without errors", () => {
      expect(() => {
        require("./tables");
      }).not.toThrow();
    });

    it("should be importable multiple times", () => {
      const tables1 = require("./tables");
      const tables2 = require("./tables");

      // Should be the same object reference (module caching)
      expect(tables1).toBe(tables2);
    });

    it("should maintain object references across imports", () => {
      const { users: users1 } = require("./tables");
      const { users: users2 } = require("./tables");

      expect(users1).toBe(users2);
    });
  });

  describe("table categorization", () => {
    it("should export authentication-related tables", () => {
      const { users, sessions, accounts, verifications } = require("./tables");

      expect(users).toBeDefined();
      expect(sessions).toBeDefined();
      expect(accounts).toBeDefined();
      expect(verifications).toBeDefined();
    });

    it("should export billing-related tables", () => {
      const { subscriptions, payments, webhookEvents } = require("./tables");

      expect(subscriptions).toBeDefined();
      expect(payments).toBeDefined();
      expect(webhookEvents).toBeDefined();
    });

    it("should export file-related tables", () => {
      const { uploads } = require("./tables");

      expect(uploads).toBeDefined();
    });

    it("should export user role enum", () => {
      const { userRoleEnum } = require("./tables");

      expect(userRoleEnum).toBeDefined();
      expect(userRoleEnum.__type).toBe("enum");
    });
  });

  describe("type safety", () => {
    it("should export objects with expected structure", () => {
      const tables = require("./tables");

      Object.values(tables).forEach((entity: any) => {
        expect(entity).toHaveProperty("name");
        expect(entity).toHaveProperty("__type");
        expect(typeof entity.name).toBe("string");
        expect(typeof entity.__type).toBe("string");
      });
    });

    it("should distinguish between tables and enums", () => {
      const {
        users,
        accounts,
        sessions,
        verifications,
        subscriptions,
        payments,
        webhookEvents,
        uploads,
        userRoleEnum,
      } = require("./tables");

      // Tables should have table type
      [
        users,
        accounts,
        sessions,
        verifications,
        subscriptions,
        payments,
        webhookEvents,
        uploads,
      ].forEach((table) => {
        expect(table.__type).toBe("table");
      });

      // Enum should have enum type
      expect(userRoleEnum.__type).toBe("enum");
    });

    it("should have valid enum values for userRoleEnum", () => {
      const { userRoleEnum } = require("./tables");

      expect(Array.isArray(userRoleEnum.enumValues)).toBe(true);
      expect(userRoleEnum.enumValues).toContain("user");
      expect(userRoleEnum.enumValues).toContain("admin");
      expect(userRoleEnum.enumValues).toContain("super_admin");
    });
  });
});
