import { renderToStaticMarkup } from "react-dom/server";

import { createAppTranslate } from "./shared";

function createTranslator(
  messages: Record<string, string>,
  rich: (key: string, values?: Record<string, unknown>) => React.ReactNode,
) {
  return Object.assign((key: string) => messages[key], {
    has: (key: string) => key in messages,
    raw: (key: string) => messages[key],
    rich,
  });
}

describe("createAppTranslate", () => {
  it("returns plain catalog messages", () => {
    const translator = createTranslator({ greeting: "Hello" }, jest.fn());

    expect(createAppTranslate(translator)("greeting", "Fallback")).toBe(
      "Hello",
    );
  });

  it("passes primitive ICU arguments through unchanged", () => {
    const rich = jest.fn(() => "Hello Ada, you have 3 items");
    const translator = createTranslator(
      { greeting: "Hello {name}, you have {count} items" },
      rich,
    );

    createAppTranslate(translator)("greeting", "Fallback", {
      name: "Ada",
      count: 3,
    });

    expect(rich).toHaveBeenCalledWith("greeting", {
      name: "Ada",
      count: 3,
    });
  });

  it("wraps React nodes for rich-text tags", () => {
    const node = <strong>Pro</strong>;
    const rich = jest.fn((_key: string, values?: Record<string, unknown>) => {
      const renderTag = values?.plan as (
        chunks: React.ReactNode,
      ) => React.ReactNode;
      return renderTag("ignored");
    });
    const translator = createTranslator({ plan: "Choose <plan></plan>" }, rich);

    const result = createAppTranslate(translator)("plan", "Fallback", {
      plan: node,
    });

    expect(renderToStaticMarkup(<>{result}</>)).toBe("<strong>Pro</strong>");
  });

  it("renders nested rich fallback content without key warnings", () => {
    const translator = createTranslator({}, jest.fn());
    const consoleSpy = jest.spyOn(console, "error");

    const result = createAppTranslate(translator)(
      "missing",
      "Hello <strong>{name}</strong>",
      {
        name: "Ada",
        strong: (chunks) => <strong>{chunks}</strong>,
      },
    );

    expect(renderToStaticMarkup(<>{result}</>)).toBe(
      "Hello <strong>Ada</strong>",
    );
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("formats dates in missing-key fallbacks deterministically", () => {
    const translator = createTranslator({}, jest.fn());

    const result = createAppTranslate(translator)("missing", "Created {date}", {
      date: new Date("2026-07-24T00:00:00.000Z"),
    });

    expect(renderToStaticMarkup(<>{result}</>)).toBe(
      "Created 2026-07-24T00:00:00.000Z",
    );
  });
});
