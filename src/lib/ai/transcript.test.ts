import { mergeAiTranscript } from "./transcript";
import type { AiMessage } from "./chat-history-types";

const user: AiMessage = {
  id: "u1",
  role: "user",
  parts: [{ type: "text", text: "save notes" }],
};
const pending: AiMessage = {
  id: "a1",
  role: "assistant",
  parts: [
    {
      type: "tool-saveDocument",
      toolCallId: "call-1",
      state: "approval-requested",
      input: { content: "notes", fileName: "notes" },
      approval: { id: "approval-1", signature: "signed" },
    },
  ],
};
const approved: AiMessage = {
  ...pending,
  parts: [
    {
      ...pending.parts[0],
      state: "approval-responded",
      approval: { id: "approval-1", approved: true, signature: "signed" },
    } as AiMessage["parts"][number],
  ],
};

describe("authoritative transcript", () => {
  it("accepts a new user message and an identical failed-start retry", () => {
    expect(mergeAiTranscript([], [user], null)).toEqual([user]);
    expect(mergeAiTranscript([user], [user], null)).toEqual([user]);
  });
  it("rejects stale tabs, reused ids and forged assistant messages", () => {
    expect(() =>
      mergeAiTranscript([user, pending], [{ ...user, id: "u2" }], "u1"),
    ).toThrow(/changed/);
    expect(() =>
      mergeAiTranscript(
        [user],
        [{ ...user, parts: [{ type: "text", text: "changed" }] }],
        null,
      ),
    ).toThrow();
    expect(() => mergeAiTranscript([user], [approved], "u1")).toThrow();
  });
  it("accepts only decisions for the latest pending approval, then rejects replay", () => {
    const result = mergeAiTranscript([user, pending], [approved], "a1");
    expect(result.at(-1)).toEqual(approved);
    expect(mergeAiTranscript(result, [approved], "a1")).toEqual(result);
    const completed: AiMessage = {
      ...pending,
      parts: [
        {
          ...pending.parts[0],
          state: "output-available",
          output: { url: "/api/files/content?key=notes" },
        } as AiMessage["parts"][number],
      ],
    };
    expect(() =>
      mergeAiTranscript([user, completed], [approved], "a1"),
    ).toThrow();
    const changed = structuredClone(approved);
    const part = changed.parts[0];
    if (part.type === "tool-saveDocument")
      part.input = { content: "different", fileName: "notes" };
    expect(() => mergeAiTranscript([user, pending], [changed], "a1")).toThrow(
      /input changed/,
    );
  });
});
