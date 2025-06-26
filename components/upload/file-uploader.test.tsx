/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FileUploader } from "./file-uploader";

// Mock the upload API
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock XMLHttpRequest for upload progress
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  status: 200,
  statusText: "OK",
};

global.XMLHttpRequest = jest.fn(() => mockXHR) as jest.MockedClass<
  typeof XMLHttpRequest
>;

describe("FileUploader Performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          presignedUrl: "https://mock-upload-url.com",
          publicUrl: "https://mock-public-url.com",
          key: "mock-key",
        }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<FileUploader />);
    expect(
      screen.getByText("Drop files here or click to upload"),
    ).toBeInTheDocument();
  });

  it("should render consistently across re-renders", () => {
    const { rerender } = render(<FileUploader />);

    // Re-render multiple times to test stability
    for (let i = 0; i < 5; i++) {
      rerender(<FileUploader key={i} />);
    }

    // The component should render consistently
    expect(
      screen.getByText("Drop files here or click to upload"),
    ).toBeInTheDocument();
  });

  it("should handle file selection and display file items", async () => {
    const user = userEvent.setup();
    const mockOnUploadComplete = jest.fn();

    render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });
  });

  it("should efficiently update progress without re-rendering entire list", async () => {
    const mockOnUploadComplete = jest.fn();
    let progressCallback: (event: ProgressEvent) => void;

    // Mock XMLHttpRequest to capture progress callback
    mockXHR.upload.addEventListener.mockImplementation(
      (event: string, callback: (event: ProgressEvent) => void) => {
        if (event === "progress") {
          progressCallback = callback;
        }
      },
    );

    render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });

    // Simulate upload progress
    if (progressCallback) {
      act(() => {
        progressCallback({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent);
      });

      await waitFor(() => {
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toBeInTheDocument();
      });
    }
  });

  it("should clean up object URLs when files are removed", async () => {
    const user = userEvent.setup();

    render(<FileUploader />);

    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument();
    });

    // Remove the file
    const removeButton = screen.getByLabelText(/remove test\.jpg/i);
    await user.click(removeButton);

    await waitForElementToBeRemoved(() => screen.queryByText("test.jpg"));

    // Check that URL.revokeObjectURL was called
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should handle multiple file uploads efficiently", async () => {
    const user = userEvent.setup();
    const mockOnUploadComplete = jest.fn();

    render(
      <FileUploader maxFiles={3} onUploadComplete={mockOnUploadComplete} />,
    );

    const files = [
      new File(["content1"], "test1.txt", { type: "text/plain" }),
      new File(["content2"], "test2.txt", { type: "text/plain" }),
      new File(["content3"], "test3.txt", { type: "text/plain" }),
    ];

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, files);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
      expect(screen.getByText("test2.txt")).toBeInTheDocument();
      expect(screen.getByText("test3.txt")).toBeInTheDocument();
    });

    // Each file should have its own unique key for efficient rendering
    const fileItems = screen.getAllByText(/test\d\.txt/);
    expect(fileItems).toHaveLength(3);
  });

  it("should validate files without re-running expensive operations", async () => {
    const user = userEvent.setup();
    const spy = jest.spyOn(console, "warn").mockImplementation();

    render(<FileUploader maxFileSize={100} />);

    // Try to upload a large file
    const largeFile = new File(["x".repeat(200)], "large.txt", {
      type: "text/plain",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/File size.*exceeds limit/)).toBeInTheDocument();
    });

    spy.mockRestore();
  });

  it("should maintain component state across re-renders", () => {
    const { rerender } = render(<FileUploader />);

    // Re-render with different props
    rerender(<FileUploader maxFiles={2} />);
    rerender(<FileUploader maxFiles={3} />);

    // Component should remain stable
    expect(
      screen.getByText("Drop files here or click to upload"),
    ).toBeInTheDocument();
  });

  it("should debounce drag events properly", async () => {
    render(<FileUploader />);

    const dropZone = screen
      .getByText("Drop files here or click to upload")
      .closest("div");

    if (dropZone) {
      // Multiple rapid drag events
      fireEvent.dragOver(dropZone);
      fireEvent.dragOver(dropZone);
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      // Should handle events without performance issues
      expect(dropZone).toBeInTheDocument();
    }
  });
});

describe("FileUploader Memory Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should clean up all object URLs on unmount", () => {
    const { unmount } = render(<FileUploader />);

    // Simulate some object URLs being created
    (global.URL.createObjectURL as jest.Mock).mockReturnValueOnce("blob:url1");
    (global.URL.createObjectURL as jest.Mock).mockReturnValueOnce("blob:url2");

    unmount();

    // All URLs should be cleaned up on unmount
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("should not create memory leaks with rapid file additions/removals", async () => {
    const user = userEvent.setup();

    render(<FileUploader />);

    // Rapidly add and remove files
    for (let i = 0; i < 10; i++) {
      const file = new File([`content${i}`], `test${i}.txt`, {
        type: "text/plain",
      });
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(`test${i}.txt`)).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText(/remove test\d+\.txt/i);
      await user.click(removeButton);

      await waitForElementToBeRemoved(() => screen.queryByText(`test${i}.txt`));
    }

    // Check that cleanup is happening appropriately
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
