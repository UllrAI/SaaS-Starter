import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { createChat } from "@shadcn/helpers/ai-sdk";

import type { AiMessage } from "@/lib/ai/chat-history-types";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <>{children}</>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }));

const { ChatPanel } =
  jest.requireActual<typeof import("./chat-panel")>("./chat-panel");

const handlers = {
  onAddImages: jest.fn(),
  onNewConversation: jest.fn(),
  onOpenArtifact: jest.fn(),
  onOpenCanvas: jest.fn(),
  onOpenHistory: jest.fn(),
  onOpenMessage: jest.fn(),
  onReasoningEffortChange: jest.fn(),
  onRemoveImage: jest.fn(),
  onRetry: jest.fn(),
  onRetryImage: jest.fn(),
  onStop: jest.fn(),
};

const scriptedTransport = createChat<AiMessage>({
  now: "2026-08-22T00:00:00Z",
})
  .user("How do I get started?", { id: "user-1" })
  .assistant(
    ({ writer }) => {
      writer
        .reasoning("I should give a concise answer.", { mode: "instant" })
        .text("Start with your workspace settings.", { mode: "instant" })
        .sourceUrl({
          sourceId: "source-1",
          title: "Setup guide",
          url: "https://example.com/setup",
        });
      writer.tool("presentArtifact", {
        input: { title: "Launch plan" },
        output: { title: "Launch plan" },
        toolCallId: "artifact-1",
      });
    },
    { id: "assistant-1" },
  )
  .transport({ delayMs: 0 });

function ScriptedChatPanel() {
  const [input, setInput] = useState("");
  const { error, messages, regenerate, sendMessage, status, stop } =
    useChat<AiMessage>({
      transport: scriptedTransport,
    });

  return (
    <ChatPanel
      {...handlers}
      conversationId="conversation-1"
      messages={messages}
      input={input}
      status={status}
      error={error}
      reasoningEffort="medium"
      canvasCount={0}
      canvasOpen={false}
      conversationLoading={false}
      imageAttachments={[]}
      imageUploadsEnabled={false}
      imageUploadError={false}
      canAddImage={false}
      onInputChange={setInput}
      onSubmit={(text) => {
        const nextMessage = text ?? input;
        if (!nextMessage.trim()) return;
        setInput("");
        void sendMessage({ text: nextMessage });
      }}
      onStop={() => void stop()}
      onRetry={() => void regenerate()}
    />
  );
}

function renderComposer({ onSubmit = jest.fn() } = {}) {
  render(
    <ChatPanel
      {...handlers}
      messages={[]}
      input="你好"
      status="ready"
      reasoningEffort="medium"
      canvasCount={0}
      canvasOpen={false}
      conversationLoading={false}
      imageAttachments={[]}
      imageUploadsEnabled={false}
      imageUploadError={false}
      canAddImage={false}
      onInputChange={jest.fn()}
      onSubmit={onSubmit}
    />,
  );
  return { input: screen.getByRole("textbox", { name: "Message" }), onSubmit };
}

describe("ChatPanel", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs a deterministic AI SDK conversation through the real chat UI", async () => {
    render(<ScriptedChatPanel />);

    expect(screen.getByRole("region", { name: "Messages" })).toBeVisible();
    expect(screen.getByRole("log")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "How do I get started?" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Start with your workspace settings."),
      ).toBeVisible();
    });
    const reasoning = screen.getByText("I should give a concise answer.");
    expect(reasoning).not.toBeVisible();
    fireEvent.click(screen.getByText("Reasoning"));
    expect(reasoning).toBeVisible();
    expect(screen.getByRole("link", { name: "Setup guide" })).toHaveAttribute(
      "href",
      "https://example.com/setup",
    );
    const artifactButton = screen.getByRole("button", {
      name: /Document ready in canvas/,
    });
    expect(artifactButton).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeVisible();
    const openMessageButton = screen.getByRole("button", {
      name: "Open in canvas",
    });
    expect(openMessageButton).toBeVisible();

    fireEvent.click(artifactButton);
    expect(handlers.onOpenArtifact).toHaveBeenCalledWith("assistant-1:3");
    fireEvent.click(openMessageButton);
    expect(handlers.onOpenMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "assistant-1" }),
    );

    await waitFor(() => expect(screen.queryByText("Thinking…")).toBeNull());
  });

  it("previews a user image in an accessible modal", async () => {
    const imageUrl = "https://cdn.example.com/reference.png";
    const message: AiMessage = {
      id: "user-image",
      role: "user",
      parts: [
        {
          type: "file",
          filename: "reference.png",
          mediaType: "image/png",
          url: imageUrl,
        },
      ],
    };

    render(
      <ChatPanel
        {...handlers}
        messages={[message]}
        input=""
        status="ready"
        reasoningEffort="medium"
        canvasCount={0}
        canvasOpen={false}
        conversationLoading={false}
        imageAttachments={[]}
        imageUploadsEnabled={false}
        imageUploadError={false}
        canAddImage={false}
        onInputChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: "reference.png" })).toBeNull();
    const previewButton = screen.getByRole("button", {
      name: "Preview reference.png",
    });
    fireEvent.click(previewButton);

    expect(screen.getByRole("dialog", { name: "reference.png" })).toBeVisible();
    expect(screen.getByRole("img", { name: "reference.png" })).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "reference.png" }),
      ).toBeNull();
    });
    expect(previewButton).toHaveFocus();
  });

  it("does not submit Enter while an IME composition is active", () => {
    const { input, onSubmit } = renderComposer();

    fireEvent.keyDown(input, {
      code: "Enter",
      isComposing: true,
      key: "Enter",
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit Safari's IME confirmation Enter", () => {
    const { input, onSubmit } = renderComposer();

    fireEvent.keyDown(input, {
      code: "Enter",
      isComposing: false,
      key: "Enter",
      keyCode: 229,
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits Enter outside an IME composition", () => {
    const { input, onSubmit } = renderComposer();

    fireEvent.keyDown(input, { code: "Enter", key: "Enter" });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
