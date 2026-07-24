import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createPresignedUploadTransport } from "./transport";
import { FileUploadIssueError } from "./types";

const originalFetch = global.fetch;
const originalXmlHttpRequest = global.XMLHttpRequest;

class MockXmlHttpRequest {
  static latest: MockXmlHttpRequest | null = null;

  status = 201;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  headers = new Map<string, string>();
  url = "";

  constructor() {
    MockXmlHttpRequest.latest = this;
  }

  open(_method: string, url: string) {
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers.set(name, value);
  }

  send() {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded: 4,
      total: 4,
    } as ProgressEvent);
    this.onload?.();
  }

  abort() {
    this.onabort?.();
  }
}

describe("presigned upload transport", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    global.XMLHttpRequest = originalXmlHttpRequest;
    MockXmlHttpRequest.latest = null;
  });

  it("uses a conditional PUT and completes the original API contract", async () => {
    const uploadedFile = {
      key: "uploads/user/upload-id.jpeg",
      url: "https://cdn.example.com/uploads/user/upload-id.jpeg",
      fileName: "photo.jpeg",
      size: 4,
      contentType: "image/jpeg",
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            intentId: "11111111-1111-4111-8111-111111111111",
            key: uploadedFile.key,
            protocolVersion: 2,
            publicUrl: uploadedFile.url,
            requiredHeaders: {
              "Content-Type": "image/jpeg",
              "If-None-Match": "*",
            },
            presignedUrl:
              "https://bucket.r2.cloudflarestorage.com/signed-upload",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file: uploadedFile }), { status: 200 }),
      );
    global.fetch = fetchMock as typeof fetch;
    global.XMLHttpRequest =
      MockXmlHttpRequest as unknown as typeof XMLHttpRequest;

    const file = new File(["data"], "photo.jpeg", {
      type: "image/jpeg; charset=binary",
    });
    const progress = jest.fn();
    const transport = createPresignedUploadTransport();
    const result = await transport.startUpload({ file, onProgress: progress })
      .promise;

    expect(result).toEqual(uploadedFile);
    expect(MockXmlHttpRequest.latest?.headers.get("Content-Type")).toBe(
      "image/jpeg",
    );
    expect(MockXmlHttpRequest.latest?.headers.get("If-None-Match")).toBe("*");
    expect(progress).toHaveBeenLastCalledWith(100);

    const presignInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(presignInit.body))).toEqual({
      protocolVersion: 2,
      fileName: "photo.jpeg",
      contentType: "image/jpeg",
      size: 4,
    });

    const completeInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(completeInit.body))).toEqual({
      intentId: "11111111-1111-4111-8111-111111111111",
      fileName: "photo.jpeg",
      contentType: "image/jpeg",
      size: 4,
      key: uploadedFile.key,
      url: uploadedFile.url,
    });
  });

  it("maps the controlled quota response to a local UI issue", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "UPLOAD_QUOTA_EXCEEDED",
          error: "Daily upload quota reached.",
        }),
        { status: 403 },
      ),
    ) as typeof fetch;

    const file = new File(["data"], "photo.jpeg", { type: "image/jpeg" });
    const task = createPresignedUploadTransport().startUpload({
      file,
      onProgress: jest.fn(),
    });

    await expect(task.promise).rejects.toEqual(
      expect.objectContaining<FileUploadIssueError>({
        issue: expect.objectContaining({ code: "upload-quota-exceeded" }),
      }),
    );
  });
});
