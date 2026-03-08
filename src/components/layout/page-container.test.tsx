import { render } from "@testing-library/react";
import {
  CompactContainer,
  ReadingContainer,
  SectionContainer,
  ShellContainer,
} from "./page-container";

describe("page containers", () => {
  it("applies the shared gutter classes", () => {
    const { container } = render(<SectionContainer>Content</SectionContainer>);

    expect(container.firstChild).toHaveClass(
      "mx-auto",
      "w-full",
      "px-4",
      "sm:px-6",
      "lg:px-8",
    );
  });

  it("uses semantic width classes for each container", () => {
    const { container: shell } = render(<ShellContainer>Shell</ShellContainer>);
    const { container: section } = render(
      <SectionContainer>Section</SectionContainer>,
    );
    const { container: reading } = render(
      <ReadingContainer>Reading</ReadingContainer>,
    );
    const { container: compact } = render(
      <CompactContainer>Compact</CompactContainer>,
    );

    expect(shell.firstChild).toHaveClass("max-w-7xl");
    expect(section.firstChild).toHaveClass("max-w-6xl");
    expect(reading.firstChild).toHaveClass("max-w-5xl");
    expect(compact.firstChild).toHaveClass("max-w-md");
  });
});
