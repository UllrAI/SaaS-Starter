import { render, screen } from "@testing-library/react";
import {
  CONTACT_EMAIL,
  DOCS_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
} from "@/lib/config/constants";
import { ContactMethods } from "./contact-methods";

describe("ContactMethods", () => {
  it("renders real support destinations instead of placeholders", () => {
    render(<ContactMethods />);

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    expect(
      screen.getByRole("link", { name: "Open Discussions" }),
    ).toHaveAttribute("href", GITHUB_DISCUSSIONS_URL);
    expect(screen.getByRole("link", { name: "Open Issues" })).toHaveAttribute(
      "href",
      GITHUB_ISSUES_URL,
    );
    expect(screen.getByRole("link", { name: "Read Docs" })).toHaveAttribute(
      "href",
      DOCS_URL,
    );
  });
});
