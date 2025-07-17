import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";
import { DashboardPageWrapper } from "./dashboard-page-wrapper";

// Mock the DashboardPageHeader component
jest.mock("./dashboard-page-header", () => ({
  DashboardPageHeader: ({
    title,
    parentTitle,
    parentUrl,
    description,
    actions,
    showSidebarTrigger,
  }: {
    title: string;
    parentTitle?: string;
    parentUrl?: string;
    description?: string;
    actions?: React.ReactNode;
    showSidebarTrigger?: boolean;
  }) => (
    <header data-testid="dashboard-page-header">
      <span data-testid="header-title">{title}</span>
      {parentTitle && (
        <span data-testid="header-parent-title">{parentTitle}</span>
      )}
      {parentUrl && <span data-testid="header-parent-url">{parentUrl}</span>}
      {description && (
        <span data-testid="header-description">{description}</span>
      )}
      {actions && <div data-testid="header-actions">{actions}</div>}
      <span data-testid="header-sidebar-trigger">
        {showSidebarTrigger ? "true" : "false"}
      </span>
    </header>
  ),
}));

describe("DashboardPageWrapper", () => {
  it("should render with required props", () => {
    render(
      <DashboardPageWrapper title="Test Title">
        <div data-testid="child-content">Child Content</div>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("dashboard-page-header")).toBeInTheDocument();
    expect(screen.getByTestId("header-title")).toHaveTextContent("Test Title");
    expect(screen.getByTestId("child-content")).toHaveTextContent(
      "Child Content",
    );
  });

  it("should pass all props to DashboardPageHeader", () => {
    const actions = <button data-testid="custom-action">Action</button>;
    render(
      <DashboardPageWrapper
        title="Child Page"
        parentTitle="Parent Page"
        parentUrl="/parent"
        description="Test description"
        actions={actions}
        showSidebarTrigger={false}
      >
        <div data-testid="child-content">Child Content</div>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("header-title")).toHaveTextContent("Child Page");
    expect(screen.getByTestId("header-parent-title")).toHaveTextContent(
      "Parent Page",
    );
    expect(screen.getByTestId("header-parent-url")).toHaveTextContent(
      "/parent",
    );
    expect(screen.getByTestId("header-description")).toHaveTextContent(
      "Test description",
    );
    expect(screen.getByTestId("header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("custom-action")).toBeInTheDocument();
    expect(screen.getByTestId("header-sidebar-trigger")).toHaveTextContent(
      "false",
    );
  });

  it("should render children in main element", () => {
    render(
      <DashboardPageWrapper title="Test Title">
        <h1 data-testid="main-heading">Main Content</h1>
        <p data-testid="main-paragraph">This is the main content area.</p>
      </DashboardPageWrapper>,
    );

    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("flex-1", "space-y-6", "px-4", "py-2");

    expect(screen.getByTestId("main-heading")).toHaveTextContent(
      "Main Content",
    );
    expect(screen.getByTestId("main-paragraph")).toHaveTextContent(
      "This is the main content area.",
    );
  });

  it("should default showSidebarTrigger to true", () => {
    render(
      <DashboardPageWrapper title="Test Title">
        <div>Content</div>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("header-sidebar-trigger")).toHaveTextContent(
      "true",
    );
  });

  it("should render multiple children", () => {
    render(
      <DashboardPageWrapper title="Test Title">
        <div data-testid="first-child">First Child</div>
        <div data-testid="second-child">Second Child</div>
        <div data-testid="third-child">Third Child</div>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("first-child")).toBeInTheDocument();
    expect(screen.getByTestId("second-child")).toBeInTheDocument();
    expect(screen.getByTestId("third-child")).toBeInTheDocument();
  });

  it("should render with only title and children", () => {
    render(
      <DashboardPageWrapper title="Minimal Title">
        <div data-testid="minimal-content">Minimal Content</div>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("header-title")).toHaveTextContent(
      "Minimal Title",
    );
    expect(screen.getByTestId("minimal-content")).toHaveTextContent(
      "Minimal Content",
    );
    expect(screen.queryByTestId("header-parent-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-description")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-actions")).not.toBeInTheDocument();
  });

  it("should render complex children elements", () => {
    render(
      <DashboardPageWrapper title="Complex Title">
        <section data-testid="complex-section">
          <h2 data-testid="section-title">Section Title</h2>
          <ul data-testid="section-list">
            <li data-testid="list-item-1">Item 1</li>
            <li data-testid="list-item-2">Item 2</li>
          </ul>
        </section>
      </DashboardPageWrapper>,
    );

    expect(screen.getByTestId("complex-section")).toBeInTheDocument();
    expect(screen.getByTestId("section-title")).toHaveTextContent(
      "Section Title",
    );
    expect(screen.getByTestId("section-list")).toBeInTheDocument();
    expect(screen.getByTestId("list-item-1")).toHaveTextContent("Item 1");
    expect(screen.getByTestId("list-item-2")).toHaveTextContent("Item 2");
  });
});
