import { cn, formatCurrency, renderMarkdoc, calculateReadingTime } from "./utils";
import { type Node } from "@markdoc/markdoc";

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
    const stringNode = "Hello, world!";
    expect(renderMarkdoc(stringNode as unknown as Node)).toBe("Hello, world!");
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
    const textNode: Node = {
      type: "text",
      attributes: {
        content: "This is text content"
      }
    };
    expect(renderMarkdoc(textNode)).toBe("This is text content");
  });

  it("should handle text nodes without content attribute", () => {
    const textNode: Node = {
      type: "text",
      attributes: {}
    };
    expect(renderMarkdoc(textNode)).toBe("");
  });

  it("should handle text nodes with non-string content", () => {
    const textNode: Node = {
      type: "text",
      attributes: {
        content: 123
      }
    };
    expect(renderMarkdoc(textNode)).toBe("");
  });

  it("should render nodes with children", () => {
    const nodeWithChildren: Node = {
      type: "paragraph",
      children: [
        {
          type: "text",
          attributes: { content: "Hello" }
        },
        {
          type: "text", 
          attributes: { content: "world" }
        }
      ]
    };
    expect(renderMarkdoc(nodeWithChildren)).toBe("Hello world");
  });

  it("should render nested nodes with children", () => {
    const nestedNode: Node = {
      type: "section",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              attributes: { content: "First" }
            }
          ]
        },
        {
          type: "paragraph", 
          children: [
            {
              type: "text",
              attributes: { content: "Second" }
            }
          ]
        }
      ]
    };
    expect(renderMarkdoc(nestedNode)).toBe("First Second");
  });

  it("should render array of nodes", () => {
    const nodes: Node[] = [
      {
        type: "text",
        attributes: { content: "First node" }
      },
      {
        type: "text",
        attributes: { content: "Second node" }
      }
    ];
    expect(renderMarkdoc(nodes)).toBe("First nodeSecond node");
  });

  it("should handle mixed node types in array", () => {
    const nodes: Node[] = [
      "String node",
      {
        type: "text",
        attributes: { content: "Text node" }
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            attributes: { content: "Child text" }
          }
        ]
      }
    ] as Node[];
    expect(renderMarkdoc(nodes)).toBe("String nodeText nodeChild text");
  });

  it("should handle empty children array", () => {
    const nodeWithEmptyChildren: Node = {
      type: "paragraph",
      children: []
    };
    expect(renderMarkdoc(nodeWithEmptyChildren)).toBe("");
  });

  it("should handle nodes without type or children", () => {
    const nodeWithoutType: Node = {
      attributes: { someProperty: "value" }
    } as Node;
    expect(renderMarkdoc(nodeWithoutType)).toBe("");
  });
});

describe("calculateReadingTime", () => {
  it("should calculate reading time for normal text", () => {
    const text = "This is a sample text with exactly twenty words to test the reading time calculation function properly and accurately.";
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
    const htmlText = "<h1>Title</h1><p>This is a <strong>paragraph</strong> with <em>HTML</em> tags.</p>";
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
    const htmlWithSelfClosing = "Check out this image: <img src='test.jpg' alt='test' /> and this break<br/>line.";
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
    const specialText = "Café, naïve, résumé, and other special characters: @#$%^&*()!";
    expect(calculateReadingTime(specialText)).toBe("1 min read");
  });

  it("should handle text with numbers and punctuation", () => {
    const textWithNumbers = "In 2023, there were 1,000+ users who downloaded 50.5% more content.";
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
