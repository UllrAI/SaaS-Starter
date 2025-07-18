import { describe, it, expect, jest } from "@jest/globals";

// Mock the constants
jest.mock("@/lib/config/constants", () => ({
  AVATAR_STYLE: "adventurer-neutral",
}));

import { generateAvatarUrl, getUserAvatarUrl } from "./avatar";

describe("avatar utilities", () => {
  describe("generateAvatarUrl", () => {
    it("should generate correct avatar URL with default style", () => {
      const seed = "test@example.com";
      const result = generateAvatarUrl(seed);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=test%40example.com",
      );
    });

    it("should generate correct avatar URL with custom style", () => {
      const seed = "testuser";
      const style = "pixel-art";
      const result = generateAvatarUrl(seed, style);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/pixel-art/svg?seed=testuser",
      );
    });

    it("should handle special characters in seed", () => {
      const seed = "user+test@domain.com";
      const result = generateAvatarUrl(seed);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=user%2Btest%40domain.com",
      );
    });

    it("should handle empty seed", () => {
      const seed = "";
      const result = generateAvatarUrl(seed);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=",
      );
    });

    it("should handle unicode characters", () => {
      const seed = "テスト用户";
      const result = generateAvatarUrl(seed);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=%E3%83%86%E3%82%B9%E3%83%88%E7%94%A8%E6%88%B7",
      );
    });
  });

  describe("getUserAvatarUrl", () => {
    it("should return user image when provided", () => {
      const userImage = "https://example.com/avatar.jpg";
      const email = "test@example.com";
      const name = "Test User";

      const result = getUserAvatarUrl(userImage, email, name);

      expect(result).toBe(userImage);
    });

    it("should generate avatar from email when no user image", () => {
      const email = "test@example.com";
      const name = "Test User";

      const result = getUserAvatarUrl(null, email, name);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=test%40example.com",
      );
    });

    it("should generate avatar from name when no user image or email", () => {
      const name = "Test User";

      const result = getUserAvatarUrl(null, null, name);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Test%20User",
      );
    });

    it('should use default "User" seed when no parameters provided', () => {
      const result = getUserAvatarUrl(null, null, null);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=User",
      );
    });

    it("should use custom style when provided", () => {
      const email = "test@example.com";
      const style = "avataaars";

      const result = getUserAvatarUrl(null, email, null, style);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/avataaars/svg?seed=test%40example.com",
      );
    });

    it("should handle undefined vs null correctly", () => {
      const result1 = getUserAvatarUrl(
        undefined,
        "test@example.com",
        undefined,
      );
      const result2 = getUserAvatarUrl(null, "test@example.com", null);

      expect(result1).toBe(result2);
      expect(result1).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=test%40example.com",
      );
    });

    it("should prioritize email over name for seed", () => {
      const email = "priority@example.com";
      const name = "Secondary User";

      const result = getUserAvatarUrl(null, email, name);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=priority%40example.com",
      );
    });

    it("should handle empty strings as falsy values", () => {
      const result = getUserAvatarUrl("", "", "");

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=User",
      );
    });

    it("should handle whitespace-only strings as valid input", () => {
      const result = getUserAvatarUrl(
        "   ",
        "  user@example.com  ",
        "  Test User  ",
      );

      expect(result).toBe("   "); // Should return the userImage as-is, even with whitespace
    });

    it("should handle whitespace-only email and name", () => {
      const result = getUserAvatarUrl(null, "   ", "  ");

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=%20%20%20",
      ); // Should use the email
    });
  });

  describe("generateAvatarUrl edge cases", () => {
    it("should handle very long seeds", () => {
      const longSeed = "a".repeat(1000);
      const result = generateAvatarUrl(longSeed);

      expect(result).toContain(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=",
      );
      expect(result).toContain(encodeURIComponent(longSeed));
    });

    it("should handle seeds with all special characters", () => {
      const specialSeed = "!@#$%^&*()[]{}|;:,.<>?/~`";
      const result = generateAvatarUrl(specialSeed);

      expect(result).toBe(
        `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(specialSeed)}`,
      );
    });

    it("should handle seeds that need URL encoding", () => {
      const encodingSeed = "user name+test@domain.com?param=value&other=true";
      const result = generateAvatarUrl(encodingSeed);

      expect(result).toBe(
        `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(encodingSeed)}`,
      );
    });

    it("should handle different avatar styles", () => {
      const seed = "test@example.com";
      const styles = [
        "pixel-art",
        "avataaars",
        "big-smile",
        "bottts",
        "identicon",
      ];

      styles.forEach((style) => {
        const result = generateAvatarUrl(seed, style);
        expect(result).toBe(
          `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`,
        );
      });
    });

    it("should handle null and undefined seeds", () => {
      const nullResult = generateAvatarUrl(null);
      const undefinedResult = generateAvatarUrl(undefined);

      expect(nullResult).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=null",
      );
      expect(undefinedResult).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=undefined",
      );
    });

    it("should handle numeric seeds", () => {
      const numericSeed = 12345;
      const result = generateAvatarUrl(String(numericSeed));

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=12345",
      );
    });
  });

  describe("getUserAvatarUrl comprehensive edge cases", () => {
    it("should handle all parameters as null", () => {
      const result = getUserAvatarUrl(null, null, null);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=User",
      );
    });

    it("should handle all parameters as undefined", () => {
      const result = getUserAvatarUrl(undefined, undefined, undefined);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=User",
      );
    });

    it("should handle mixed null and undefined values", () => {
      const result1 = getUserAvatarUrl(null, undefined, "Test User");
      const result2 = getUserAvatarUrl(undefined, null, "Test User");

      expect(result1).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Test%20User",
      );
      expect(result2).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Test%20User",
      );
    });

    it("should prioritize user image over any other values", () => {
      const userImage = "https://example.com/avatar.jpg";
      const result = getUserAvatarUrl(
        userImage,
        "email@example.com",
        "Test User",
        "custom-style",
      );

      expect(result).toBe(userImage);
    });

    it("should handle boolean values as seeds", () => {
      const result1 = getUserAvatarUrl(null, true, null);
      const result2 = getUserAvatarUrl(null, false, null);

      // Boolean false is falsy, so it should fall back to "User"
      expect(result1).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=true",
      );
      expect(result2).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=User",
      );
    });

    it("should handle object values as seeds", () => {
      const objectSeed = { toString: () => "custom-string" };
      const result = getUserAvatarUrl(null, objectSeed.toString(), null);

      expect(result).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=custom-string",
      );
    });

    it("should handle style parameter edge cases", () => {
      const result1 = getUserAvatarUrl(null, "test@example.com", null, "");
      const result2 = getUserAvatarUrl(null, "test@example.com", null, null);
      const result3 = getUserAvatarUrl(
        null,
        "test@example.com",
        null,
        undefined,
      );

      expect(result1).toBe(
        "https://api.dicebear.com/9.x//svg?seed=test%40example.com",
      );
      expect(result2).toBe(
        "https://api.dicebear.com/9.x/null/svg?seed=test%40example.com",
      );
      // undefined defaults to AVATAR_STYLE
      expect(result3).toBe(
        "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=test%40example.com",
      );
    });

    it("should handle very long email addresses", () => {
      const longEmail = "a".repeat(100) + "@" + "b".repeat(100) + ".com";
      const result = getUserAvatarUrl(null, longEmail, null);

      expect(result).toContain(encodeURIComponent(longEmail));
    });

    it("should handle very long names", () => {
      const longName = "A".repeat(1000) + " " + "B".repeat(1000);
      const result = getUserAvatarUrl(null, null, longName);

      expect(result).toContain(encodeURIComponent(longName));
    });

    it("should maintain consistency across multiple calls with same parameters", () => {
      const email = "test@example.com";
      const name = "Test User";
      const style = "pixel-art";

      const result1 = getUserAvatarUrl(null, email, name, style);
      const result2 = getUserAvatarUrl(null, email, name, style);
      const result3 = getUserAvatarUrl(null, email, name, style);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe("URL encoding verification", () => {
    it("should properly encode complex email addresses", () => {
      const complexEmail = "user+test.name@sub-domain.example-site.co.uk";
      const result = generateAvatarUrl(complexEmail);

      expect(result).toBe(
        `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(complexEmail)}`,
      );
      expect(result).toContain(
        "user%2Btest.name%40sub-domain.example-site.co.uk",
      );
    });

    it("should properly encode names with international characters", () => {
      const internationalName = "José María González-Pérez";
      const result = generateAvatarUrl(internationalName);

      expect(result).toBe(
        `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(internationalName)}`,
      );
    });
  });
});
