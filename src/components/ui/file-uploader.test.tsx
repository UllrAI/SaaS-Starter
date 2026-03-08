import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  FileUploader,
  type UploadTransport,
  type UploadedFile,
} from "./file-uploader";

function createFile(
  name: string,
  type = "text/plain",
  contents = "hello world",
) {
  return new File([contents], name, { type });
}

function HeadlessHarness({
  maxFiles = 1,
  onUploadComplete,
  transport,
}: {
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  transport?: UploadTransport;
}) {
  return (
    <FileUploader
      autoUpload={false}
      acceptedFileTypes={["text/plain"]}
      maxFiles={maxFiles}
      onUploadComplete={onUploadComplete}
      transport={transport}
    >
      {({ getInputProps, issue, items, uploadAll }) => (
        <div>
          <input data-testid="headless-input" {...getInputProps()} />
          <button
            type="button"
            onClick={() => {
              void uploadAll();
            }}
          >
            Start upload
          </button>
          <span data-testid="issue-code">{issue?.code ?? "none"}</span>
          <span data-testid="item-count">{items.length}</span>
          {items.map((item) => (
            <span key={item.id} data-testid={`status-${item.id}`}>
              {item.status}
            </span>
          ))}
        </div>
      )}
    </FileUploader>
  );
}

describe("FileUploader", () => {
  beforeEach(() => {
    Object.defineProperty(global.URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:test-preview"),
      writable: true,
    });
    Object.defineProperty(global.URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
      writable: true,
    });
  });

  it("renders selected files in the default UI without starting uploads", async () => {
    const { container } = render(
      <FileUploader
        autoUpload={false}
        acceptedFileTypes={["text/plain"]}
        maxFiles={2}
      />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;

    if (!input) {
      throw new Error("Expected file input to be rendered");
    }

    fireEvent.change(input, {
      target: {
        files: [createFile("notes.txt")],
      },
    });

    expect(await screen.findByText("notes.txt")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
  });

  it("supports headless usage and reports validation issues via issue codes", async () => {
    render(<HeadlessHarness maxFiles={1} />);

    fireEvent.change(screen.getByTestId("headless-input"), {
      target: {
        files: [createFile("first.txt"), createFile("second.txt")],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("issue-code")).toHaveTextContent(
        "too-many-files",
      );
    });
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
  });

  it("uploads through a custom transport and calls onUploadComplete once", async () => {
    const uploadedFile: UploadedFile = {
      contentType: "text/plain",
      fileName: "report.txt",
      key: "uploads/test/report.txt",
      size: 11,
      url: "https://example.com/report.txt",
    };
    const onUploadComplete = jest.fn();
    const transport: UploadTransport = {
      startUpload: ({ onProgress }) => {
        onProgress(40);

        return {
          promise: Promise.resolve(uploadedFile),
        };
      },
    };

    render(
      <HeadlessHarness
        onUploadComplete={onUploadComplete}
        transport={transport}
      />,
    );

    fireEvent.change(screen.getByTestId("headless-input"), {
      target: {
        files: [createFile("report.txt")],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Start upload" }));

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith([uploadedFile]);
    });
  });
});
