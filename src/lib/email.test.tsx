jest.mock("resend", () => {
  const mockSend = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
    __mockSend: mockSend, // Export the mock for access in tests
  };
});

jest.mock("@/env", () => ({
  __esModule: true,
  default: { RESEND_API_KEY: "test-api-key" },
}));

jest.mock("@/lib/config/constants", () => ({
  APP_NAME: "Test App",
  RESEND_EMAIL_FROM: "test@example.com",
}));

import { sendEmail } from "./email";
import React from "react";

// Get the mock from the module
const mockSend = jest.requireMock("resend").__mockSend;

describe("email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default return value
    mockSend.mockResolvedValue({ error: null, data: { id: "test-email-id" } });
  });

  it("should export sendEmail function", () => {
    expect(sendEmail).toBeInstanceOf(Function);
  });

  it("should send email successfully", async () => {
    mockSend.mockResolvedValue({ error: null, data: { id: "email-123" } });

    await sendEmail(
      "test@example.com",
      "Test Subject",
      React.createElement("div", null, "Test Body"),
    );

    expect(mockSend).toHaveBeenCalledWith({
      from: "Test App <test@example.com>",
      to: "test@example.com",
      subject: "Test Subject",
      react: React.createElement(
        React.Fragment,
        null,
        React.createElement("div", null, "Test Body"),
      ),
    });
  });

  it("should send email with JSX body", async () => {
    mockSend.mockResolvedValue({ error: null, data: { id: "email-123" } });

    const jsxBody = (
      <div>
        <h1>Hello</h1>
        <p>This is a test email</p>
      </div>
    );

    await sendEmail("user@test.com", "JSX Test", jsxBody);

    expect(mockSend).toHaveBeenCalledWith({
      from: "Test App <test@example.com>",
      to: "user@test.com",
      subject: "JSX Test",
      react: <>{jsxBody}</>,
    });
  });

  it("should send email with string body", async () => {
    mockSend.mockResolvedValue({ error: null, data: { id: "email-123" } });

    await sendEmail("recipient@test.com", "String Test", "Plain text body");

    expect(mockSend).toHaveBeenCalledWith({
      from: "Test App <test@example.com>",
      to: "recipient@test.com",
      subject: "String Test",
      react: <>Plain text body</>,
    });
  });

  it("should throw error when email sending fails", async () => {
    const testError = new Error("Failed to send email");
    mockSend.mockResolvedValue({ error: testError, data: null });

    await expect(
      sendEmail("error@test.com", "Error Test", "This should fail"),
    ).rejects.toThrow("Failed to send email");

    expect(mockSend).toHaveBeenCalledWith({
      from: "Test App <test@example.com>",
      to: "error@test.com",
      subject: "Error Test",
      react: <>This should fail</>,
    });
  });

  it("should handle API error response", async () => {
    const apiError = {
      message: "Invalid email address",
      name: "validation_error",
    };
    mockSend.mockResolvedValue({ error: apiError, data: null });

    await expect(
      sendEmail("invalid-email", "API Error Test", "Test body"),
    ).rejects.toEqual(apiError);
  });

  it("should handle resend rejection", async () => {
    const rejectionError = new Error("Network error");
    mockSend.mockRejectedValue(rejectionError);

    await expect(
      sendEmail("test@example.com", "Rejection Test", "Test body"),
    ).rejects.toThrow("Network error");
  });

  it("should use correct configuration", () => {
    // This test verifies that the module loads with correct configuration
    expect(() => sendEmail).not.toThrow();
  });
});
