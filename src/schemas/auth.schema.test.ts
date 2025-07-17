import { authSchema } from "./auth.schema";

describe("authSchema", () => {
  describe("email validation", () => {
    it("should accept valid email addresses", () => {
      const validEmails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "user+tag@example.org",
      ];

      validEmails.forEach((email) => {
        const result = authSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user..double.dot@example.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        const result = authSchema.safeParse({ email });
        expect(result.success).toBe(false);
      });
    });

    it("should trim whitespace from email addresses", () => {
      const emailsWithWhitespace = [
        "  user@example.com  ",
        "\tuser@example.com\t",
        "\nuser@example.com\n",
        " user@example.com",
        "user@example.com ",
      ];

      emailsWithWhitespace.forEach((email) => {
        const result = authSchema.safeParse({ email });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("user@example.com");
        }
      });
    });

    it("should normalize email addresses to lowercase", () => {
      const emailsWithMixedCase = [
        "User@Example.Com",
        "USER@EXAMPLE.COM",
        "UsEr@ExAmPlE.cOm",
        "test.USER@DOMAIN.CO.UK",
      ];

      emailsWithMixedCase.forEach((email) => {
        const result = authSchema.safeParse({ email });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(email.toLowerCase());
        }
      });
    });

    it("should handle combined whitespace and case normalization", () => {
      const testCases = [
        { input: "  User@Example.Com  ", expected: "user@example.com" },
        { input: "\tUSER@EXAMPLE.COM\t", expected: "user@example.com" },
        { input: " UsEr@ExAmPlE.cOm ", expected: "user@example.com" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = authSchema.safeParse({ email: input });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(expected);
        }
      });
    });

    it("should return appropriate error message for invalid emails", () => {
      const result = authSchema.safeParse({ email: "invalid-email" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please enter a valid email address",
        );
      }
    });
  });
});
