import {
  cn,
  formatCurrency,
  renderMarkdoc,
  calculateReadingTime,
} from "./utils";
import { type Node } from "@markdoc/markdoc";

import { Node as MarkdocNode } from "@markdoc/markdoc";

// Helper to create properly typed Markdoc Node objects
const createNode = (overrides: Partial<Node> = {}): Node => {
  const node = new MarkdocNode(
    overrides.type || "text",
    overrides.attributes || {},
    overrides.children || [],
    overrides.tag,
  );

  // Apply any additional overrides
  if (overrides.inline !== undefined) node.inline = overrides.inline;
  if (overrides.location !== undefined) node.location = overrides.location;
  if (overrides.annotations !== undefined)
    node.annotations = overrides.annotations;
  if (overrides.slots !== undefined) node.slots = overrides.slots;
  if (overrides.errors !== undefined) node.errors = overrides.errors;

  return node;
};

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("should handle conditional class names", () => {
    expect(cn("bg-red-500", { "text-white": true, "font-bold": false })).toBe(
      "bg-red-500 text-white",
    );
  });

  it("should override conflicting Tailwind CSS classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("should handle mixed valid and invalid inputs", () => {
    expect(
      cn("bg-blue-500", null, "text-lg", undefined, { "mx-auto": true }),
    ).toBe("bg-blue-500 text-lg mx-auto");
  });
});

describe("formatCurrency", () => {
  it("should format cents to USD currency by default", () => {
    expect(formatCurrency(1299)).toBe("$12.99");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(100)).toBe("$1.00");
    expect(formatCurrency(50)).toBe("$0.50");
  });

  it("should format cents to specified currency", () => {
    expect(formatCurrency(1299, "EUR")).toBe("€12.99");
    expect(formatCurrency(1299, "GBP")).toBe("£12.99");
    expect(formatCurrency(1299, "JPY")).toBe("¥13"); // JPY doesn't use decimal places
  });

  it("should handle large amounts correctly", () => {
    expect(formatCurrency(123456789)).toBe("$1,234,567.89");
    expect(formatCurrency(999999)).toBe("$9,999.99");
  });

  it("should handle negative amounts", () => {
    expect(formatCurrency(-1299)).toBe("-$12.99");
    expect(formatCurrency(-100)).toBe("-$1.00");
  });

  it("should handle edge cases", () => {
    expect(formatCurrency(1)).toBe("$0.01");
    expect(formatCurrency(99)).toBe("$0.99");
  });
});

describe("renderMarkdoc", () => {
  it("should render a string node", () => {
    // Test with string passed directly
    expect(renderMarkdoc("Hello, world!" as unknown as Node)).toBe(
      "Hello, world!",
    );
  });

  it("should render null or undefined nodes as empty string", () => {
    expect(renderMarkdoc(null as unknown as Node)).toBe("");
    expect(renderMarkdoc(undefined as unknown as Node)).toBe("");
  });

  it("should render non-object nodes as empty string", () => {
    expect(renderMarkdoc(123 as unknown as Node)).toBe("");
    expect(renderMarkdoc(true as unknown as Node)).toBe("");
  });

  it("should render text nodes with content", () => {
    const textNode = createNode({
      type: "text",
      attributes: {
        content: "This is text content",
      },
    });
    expect(renderMarkdoc(textNode)).toBe("This is text content");
  });

  it("should handle text nodes without content attribute", () => {
    const textNode = createNode({
      type: "text",
      attributes: {},
    });
    expect(renderMarkdoc(textNode)).toBe("");
  });

  it("should handle text nodes with non-string content", () => {
    const textNode = createNode({
      type: "text",
      attributes: {
        content: 123,
      },
    });
    expect(renderMarkdoc(textNode)).toBe("");
  });

  it("should render nodes with children", () => {
    const nodeWithChildren = createNode({
      type: "paragraph",
      children: [
        createNode({
          type: "text",
          attributes: { content: "Hello " },
        }),
        createNode({
          type: "text",
          attributes: { content: "world!" },
        }),
      ],
    });
    expect(renderMarkdoc(nodeWithChildren)).toBe("Hello world!");
  });

  it("should render nested nodes with children", () => {
    const nestedChildren = [
      createNode({
        type: "text",
        attributes: { content: "Nested " },
      }),
      createNode({
        type: "text",
        attributes: { content: "content" },
      }),
    ];

    const nodeWithNestedChildren = createNode({
      type: "paragraph",
      children: [
        createNode({
          type: "paragraph",
          children: nestedChildren,
        }),
      ],
    });

    expect(renderMarkdoc(nodeWithNestedChildren)).toBe("Nested content");
  });

  it("should handle empty nodes", () => {
    const emptyNode = createNode({
      type: "paragraph",
      children: [],
    });
    const emptyTextNode = createNode({
      type: "text",
      attributes: {
        content: "",
      },
    });

    expect(renderMarkdoc(emptyNode)).toBe("");
    expect(renderMarkdoc(emptyTextNode)).toBe("");
  });

  it("should handle mixed empty and non-empty content", () => {
    const emptyTextNode = createNode({
      type: "text",
      attributes: { content: "" },
    });
    const emptyNode = createNode({
      type: "paragraph",
      children: [],
    });

    const nodeWithMixedContent = createNode({
      type: "paragraph",
      children: [
        emptyTextNode,
        createNode({
          type: "text",
          attributes: { content: "Content" },
        }),
        emptyNode,
      ],
    });

    expect(renderMarkdoc(nodeWithMixedContent)).toBe("Content");
  });

  it("should handle non-text nodes without content", () => {
    const nonTextNode = createNode({
      type: "paragraph",
      children: [],
    });
    expect(renderMarkdoc(nonTextNode)).toBe("");
  });

  it("should handle array of nodes", () => {
    const nodeArray = [
      createNode({
        type: "text",
        attributes: { content: "First " },
      }),
      createNode({
        type: "text",
        attributes: { content: "Second" },
      }),
    ];
    expect(renderMarkdoc(nodeArray as unknown as Node)).toBe("First Second");
  });

  it("should handle array with mixed node types", () => {
    const mixedArray = [
      createNode({
        type: "text",
        attributes: { content: "Text node " },
      }),
      createNode({
        type: "paragraph",
        children: [
          createNode({
            type: "text",
            attributes: { content: "in paragraph" },
          }),
        ],
      }),
    ];
    expect(renderMarkdoc(mixedArray as unknown as Node)).toBe(
      "Text node in paragraph",
    );
  });

  it("should handle nodes without children property but still object type", () => {
    const nodeWithoutChildren = createNode({
      type: "image",
      attributes: { src: "image.jpg" },
      // No children property
    });
    // This should hit the final return "" case
    expect(renderMarkdoc(nodeWithoutChildren)).toBe("");
  });
});

describe("calculateReadingTime", () => {
  it("should calculate reading time for normal text", () => {
    const text =
      "This is a sample text with exactly twenty words to test the reading time calculation function properly and accurately.";
    expect(calculateReadingTime(text)).toBe("1 min read");
  });

  it("should handle empty text", () => {
    expect(calculateReadingTime("")).toBe("1 min read");
  });

  it("should handle text with only whitespace", () => {
    expect(calculateReadingTime("   \n\t  ")).toBe("1 min read");
  });

  it("should calculate reading time for longer text", () => {
    // Create text with approximately 400 words (should be 2 minutes)
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe("2 min read");
  });

  it("should calculate reading time for very long text", () => {
    // Create text with approximately 1000 words (should be 5 minutes)
    const words = Array(1000).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe("5 min read");
  });

  it("should remove HTML tags before calculating", () => {
    const htmlText =
      "<h1>Title</h1><p>This is a <strong>paragraph</strong> with <em>HTML</em> tags.</p>";
    expect(calculateReadingTime(htmlText)).toBe("1 min read");
  });

  it("should handle complex HTML with nested tags", () => {
    const complexHtml = `
      <div class="content">
        <h1>Main Title</h1>
        <p>This is the first paragraph with <a href="#">a link</a>.</p>
        <ul>
          <li>List item one</li>
          <li>List item <strong>two</strong></li>
        </ul>
        <blockquote>
          <p>This is a quote with multiple words for testing.</p>
        </blockquote>
      </div>
    `;
    expect(calculateReadingTime(complexHtml)).toBe("1 min read");
  });

  it("should handle self-closing HTML tags", () => {
    const htmlWithSelfClosing =
      "Check out this image: <img src='test.jpg' alt='test' /> and this break<br/>line.";
    expect(calculateReadingTime(htmlWithSelfClosing)).toBe("1 min read");
  });

  it("should handle malformed HTML", () => {
    const malformedHtml = "<div><p>Unclosed tags <strong>here</div>";
    expect(calculateReadingTime(malformedHtml)).toBe("1 min read");
  });

  it("should handle text with multiple spaces", () => {
    const textWithSpaces = "Word1    Word2       Word3\n\nWord4\t\tWord5";
    expect(calculateReadingTime(textWithSpaces)).toBe("1 min read");
  });

  it("should handle minimum reading time of 1 minute", () => {
    const shortText = "Just a few words.";
    expect(calculateReadingTime(shortText)).toBe("1 min read");
  });

  it("should handle text with special characters", () => {
    const specialText =
      "Café, naïve, résumé, and other special characters: @#$%^&*()!";
    expect(calculateReadingTime(specialText)).toBe("1 min read");
  });

  it("should handle text with numbers and punctuation", () => {
    const textWithNumbers =
      "In 2023, there were 1,000+ users who downloaded 50.5% more content.";
    expect(calculateReadingTime(textWithNumbers)).toBe("1 min read");
  });

  it("should properly round up partial minutes", () => {
    // Create text with approximately 250 words (1.25 minutes, should round to 2)
    const words = Array(250).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe("2 min read");
  });

  it("should handle very short text (less than 1 word)", () => {
    expect(calculateReadingTime("Hi")).toBe("1 min read");
    expect(calculateReadingTime("A")).toBe("1 min read");
  });
});
