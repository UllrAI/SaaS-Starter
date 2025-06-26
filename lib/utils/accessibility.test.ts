import {
  generateA11yId,
  createUploadInstructions,
  handleActivationKey,
  UPLOAD_MESSAGES,
} from "./accessibility";

describe("Accessibility Utilities", () => {
  describe("generateA11yId", () => {
    it("should generate unique IDs with prefix", () => {
      const id1 = generateA11yId("test");
      const id2 = generateA11yId("test");

      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });

    it("should generate different IDs for different prefixes", () => {
      const id1 = generateA11yId("upload");
      const id2 = generateA11yId("button");

      expect(id1).toMatch(/^upload-/);
      expect(id2).toMatch(/^button-/);
    });
  });

  describe("createUploadInstructions", () => {
    it("should create comprehensive upload instructions", () => {
      const instructions = createUploadInstructions({
        maxFiles: 3,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        acceptedFileTypes: ["image/jpeg", "image/png", "application/pdf"],
      });

      expect(instructions).toContain("up to 3 files");
      expect(instructions).toContain("5.0 megabytes");
      expect(instructions).toContain(
        "image/jpeg, image/png, and application/pdf",
      );
    });

    it("should handle single file scenario", () => {
      const instructions = createUploadInstructions({
        maxFiles: 1,
        maxFileSize: 2 * 1024 * 1024,
        acceptedFileTypes: ["image/jpeg"],
      });

      expect(instructions).toContain("1 file");
      expect(instructions).not.toContain("up to");
      expect(instructions).toContain("2.0 megabytes");
    });

    it("should handle empty file types array", () => {
      const instructions = createUploadInstructions({
        maxFiles: 1,
        maxFileSize: 1024 * 1024,
        acceptedFileTypes: [],
      });

      expect(instructions).toContain("all file types");
    });

    it("should format file sizes correctly", () => {
      const instructions1 = createUploadInstructions({
        maxFiles: 1,
        maxFileSize: 1024, // 1KB
        acceptedFileTypes: [],
      });

      const instructions2 = createUploadInstructions({
        maxFiles: 1,
        maxFileSize: 1024 * 1024, // 1MB
        acceptedFileTypes: [],
      });

      expect(instructions1).toContain("1.0 kilobytes");
      expect(instructions2).toContain("1.0 megabytes");
    });
  });

  describe("handleActivationKey", () => {
    let mockCallback: jest.Mock;
    let mockEvent: Partial<React.KeyboardEvent>;

    beforeEach(() => {
      mockCallback = jest.fn();
      mockEvent = {
        key: "",
        preventDefault: jest.fn(),
      };
    });

    it("should call callback on Enter key", () => {
      mockEvent.key = "Enter";

      handleActivationKey(mockEvent as React.KeyboardEvent, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("should call callback on Space key", () => {
      mockEvent.key = " ";

      handleActivationKey(mockEvent as React.KeyboardEvent, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("should not call callback on other keys", () => {
      mockEvent.key = "Tab";

      handleActivationKey(mockEvent as React.KeyboardEvent, mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("should handle callback with arguments", () => {
      mockEvent.key = "Enter";
      const callbackWithArgs = jest.fn();

      handleActivationKey(mockEvent as React.KeyboardEvent, () =>
        callbackWithArgs("test", 123),
      );

      expect(callbackWithArgs).toHaveBeenCalledWith("test", 123);
    });
  });

  describe("UPLOAD_MESSAGES", () => {
    it("should provide appropriate upload start message", () => {
      const message = UPLOAD_MESSAGES.uploadStart("test.jpg");
      expect(message).toBe("Uploading test.jpg");
    });

    it("should provide appropriate upload progress message", () => {
      const message = UPLOAD_MESSAGES.uploadProgress("test.jpg", 50);
      expect(message).toBe("test.jpg upload progress: 50%");
    });

    it("should provide appropriate upload success message", () => {
      const message = UPLOAD_MESSAGES.uploadSuccess("test.jpg");
      expect(message).toBe("test.jpg uploaded successfully");
    });

    it("should provide appropriate upload error message", () => {
      const message = UPLOAD_MESSAGES.uploadError("test.jpg", "File too large");
      expect(message).toBe("Failed to upload test.jpg. Error: File too large");
    });

    it("should provide appropriate file removed message", () => {
      const message = UPLOAD_MESSAGES.fileRemoved("test.jpg");
      expect(message).toBe("Removed test.jpg");
    });

    it("should provide appropriate files selected message", () => {
      const messageSingle = UPLOAD_MESSAGES.filesSelected(1);
      const messageMultiple = UPLOAD_MESSAGES.filesSelected(3);

      expect(messageSingle).toBe("1 file selected");
      expect(messageMultiple).toBe("3 files selected");
    });

    it("should provide appropriate drag messages", () => {
      expect(UPLOAD_MESSAGES.dragEnter).toBe(
        "Drop zone activated. Release files to upload.",
      );
      expect(UPLOAD_MESSAGES.dragLeave).toBe("Drop zone deactivated.");
    });
  });
});
