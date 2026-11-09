import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useFileUpload } from "./file-upload/use-file-upload";
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
    expect(await screen.findByText("Queued")).toBeInTheDocument();
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

  it("reserves file slots before concurrent preparations finish", async () => {
    const { result } = renderHook(() => useFileUpload({ autoUpload: false }));

    await act(async () => {
      await Promise.all([
        result.current.addFiles([createFile("first.txt")]),
        result.current.addFiles([createFile("second.txt")]),
      ]);
    });

    expect(result.current.items.map((item) => item.file.name)).toEqual([
      "first.txt",
    ]);
    expect(result.current.issue?.code).toBe("too-many-files");
  });

  it("does not start an upload when a draft is cleared during preparation", async () => {
    const startUpload = jest.fn<UploadTransport["startUpload"]>();
    const { result } = renderHook(() =>
      useFileUpload({ transport: { startUpload } }),
    );

    await act(async () => {
      const preparation = result.current.addFiles([createFile("draft.txt")]);
      result.current.clearFiles();
      await preparation;
    });

    expect(result.current.items).toEqual([]);
    expect(startUpload).not.toHaveBeenCalled();
  });

  it("can retry after the transport fails to start without starting twice", async () => {
    const file = createFile("report.txt");
    const uploadedFile: UploadedFile = {
      contentType: file.type,
      fileName: file.name,
      key: "uploads/test/report.txt",
      size: file.size,
      url: "/api/files/report",
    };
    const startUpload = jest
      .fn<UploadTransport["startUpload"]>()
      .mockImplementationOnce(() => {
        throw new Error("Transport unavailable");
      })
      .mockReturnValue({ promise: Promise.resolve(uploadedFile) });
    const onUploadComplete = jest.fn();
    const { result } = renderHook(() =>
      useFileUpload({
        autoUpload: false,
        onUploadComplete,
        transport: { startUpload },
      }),
    );

    await act(async () => result.current.addFiles([file]));
    await act(async () => result.current.uploadAll());
    expect(result.current.items[0].status).toBe("error");

    const id = result.current.items[0].id;
    await act(async () => {
      await Promise.all([
        result.current.retryFile(id),
        result.current.retryFile(id),
      ]);
    });
    expect(result.current.items[0].status).toBe("success");
    expect(startUpload).toHaveBeenCalledTimes(2);
    expect(onUploadComplete).toHaveBeenCalledTimes(1);
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
