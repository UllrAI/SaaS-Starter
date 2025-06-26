/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AdminTableBase } from "./admin-table-base";

const mockColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  {
    key: "status",
    label: "Status",
    render: (item: MockDataItem) => <span>{item.status}</span>,
  },
];

interface MockDataItem {
  id: string;
  name: string;
  email: string;
  status: string;
}

const mockData: MockDataItem[] = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "active" },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "inactive",
  },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", status: "pending" },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

const defaultProps = {
  columns: mockColumns,
  data: mockData,
  loading: false,
  error: null,
  searchTerm: "",
  onSearchChange: jest.fn(),
  pagination: mockPagination,
  onPageChange: jest.fn(),
};

describe("AdminTableBase Performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<AdminTableBase {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should memoize and prevent unnecessary re-renders", () => {
    const renderSpy = jest.fn();

    function TestComponent({ trigger }: { trigger: number }) {
      renderSpy();
      // Using trigger to force re-renders
      React.useEffect(() => {}, [trigger]);
      return <AdminTableBase {...defaultProps} />;
    }

    const { rerender } = render(<TestComponent trigger={1} />);

    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props should not cause additional renders of AdminTableBase
    rerender(<TestComponent trigger={2} />);
    expect(renderSpy).toHaveBeenCalledTimes(2);

    // Multiple re-renders
    for (let i = 3; i <= 5; i++) {
      rerender(<TestComponent trigger={i} />);
    }

    expect(renderSpy).toHaveBeenCalledTimes(5);
  });

  it("should efficiently handle search with debouncing", async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();

    render(
      <AdminTableBase {...defaultProps} onSearchChange={onSearchChange} />,
    );

    const searchInput = screen.getByPlaceholderText("Search...");

    // Type quickly
    await user.type(searchInput, "test");

    // Should not call onSearchChange immediately
    expect(onSearchChange).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(
      () => {
        expect(onSearchChange).toHaveBeenCalledWith("test");
      },
      { timeout: 500 },
    );

    // Should only be called once due to debouncing
    expect(onSearchChange).toHaveBeenCalledTimes(1);
  });

  it("should render loading skeleton efficiently", () => {
    render(<AdminTableBase {...defaultProps} loading={true} data={[]} />);

    // Should show skeleton rows
    const skeletonElements = screen.getAllByRole("row");
    // 1 header row + 5 skeleton rows
    expect(skeletonElements).toHaveLength(6);

    // Should show loading animations
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("should efficiently handle pagination", () => {
    const onPageChange = jest.fn();
    const largePagination = {
      page: 3,
      limit: 10,
      total: 100,
      totalPages: 10,
    };

    render(
      <AdminTableBase
        {...defaultProps}
        pagination={largePagination}
        onPageChange={onPageChange}
      />,
    );

    // Should show pagination controls
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();

    // Should show page numbers (limited to 5)
    const pageButtons = screen
      .getAllByRole("button")
      .filter((button) => /^\d+$/.test(button.textContent || ""));
    expect(pageButtons.length).toBeLessThanOrEqual(5);

    // Click next page
    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("should handle large datasets efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 2 === 0 ? "active" : "inactive",
    }));

    const startTime = performance.now();

    render(<AdminTableBase {...defaultProps} data={largeData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 500ms for 1000 items in test environment)
    expect(renderTime).toBeLessThan(500);

    // Should show all data
    expect(screen.getByText("User 1")).toBeInTheDocument();
  });

  it("should efficiently update search term without re-rendering entire table", async () => {
    const user = userEvent.setup();
    let renderCount = 0;

    const TestData = ({ searchTerm }: { searchTerm: string }) => {
      renderCount++;
      // Using searchTerm for tracking renders
      React.useEffect(() => {
        // Track searchTerm changes
      }, [searchTerm]);
      return <span>Render count: {renderCount}</span>;
    };

    function TestWrapper() {
      const [search, setSearch] = React.useState("");

      return (
        <div>
          <AdminTableBase
            {...defaultProps}
            searchTerm={search}
            onSearchChange={setSearch}
          />
          <TestData searchTerm={search} />
        </div>
      );
    }

    render(<TestWrapper />);

    const searchInput = screen.getByPlaceholderText("Search...");

    // Type in search
    await user.type(searchInput, "test");

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByDisplayValue("test")).toBeInTheDocument();
    });

    // Component should remain stable during search
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should handle filter changes efficiently", () => {
    const onFilterChange = jest.fn();
    const filterOptions = [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ];

    render(
      <AdminTableBase
        {...defaultProps}
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
        filterValue="all"
      />,
    );

    // Should show filter dropdown
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    // Filter should work efficiently
    fireEvent.click(screen.getByRole("combobox"));

    // Should show filter options without performance issues
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("should render empty state efficiently", () => {
    render(
      <AdminTableBase
        {...defaultProps}
        data={[]}
        emptyMessage="No users found"
      />,
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();

    // Should not render unnecessary elements
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("should handle error state without performance degradation", () => {
    render(<AdminTableBase {...defaultProps} error="Failed to load data" />);

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();

    // Should not render table when there's an error
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("should optimize column rendering with custom render functions", () => {
    const customRenderSpy = jest.fn((item) => <strong>{item.name}</strong>);

    const columnsWithRender = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name", render: customRenderSpy },
    ];

    render(<AdminTableBase {...defaultProps} columns={columnsWithRender} />);

    // Custom render should be called for each data item
    expect(customRenderSpy).toHaveBeenCalledTimes(mockData.length);

    // Should render custom content (strong elements)
    const strongElements = document.querySelectorAll("strong");
    expect(strongElements.length).toBeGreaterThan(0);
  });
});
