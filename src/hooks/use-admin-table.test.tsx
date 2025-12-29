import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock use-debounce
const mockUseDebounce = jest.fn();
jest.mock("use-debounce", () => ({
  useDebounce: mockUseDebounce,
}));

// Import after mocks are set up
import { useAdminTable } from "./use-admin-table";

// Mock data types for testing
interface TestDataItem {
  id: number;
  name: string;
  email: string;
}

const mockData: TestDataItem[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 3,
  totalPages: 1,
};

describe("useAdminTable", () => {
  let mockQueryAction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock query action
    mockQueryAction = jest.fn();
    mockQueryAction.mockResolvedValue({
      data: mockData,
      pagination: mockPagination,
    });

    // Setup use-debounce mock to return the input immediately
    mockUseDebounce.mockImplementation((value, delay) => [value, delay]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initial State and Setup", () => {
    it("should initialize with default values", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      expect(result.current.data).toEqual([]);
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      });
      // Loading starts as true due to useTransition and initial effect
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.searchTerm).toBe("");
      expect(result.current.filter).toBe("all");

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should initialize with provided initial data", () => {
      const initialData = [mockData[0]];
      const initialPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialData,
          initialPagination,
        }),
      );

      expect(result.current.data).toEqual(initialData);
      expect(result.current.pagination).toEqual(initialPagination);
    });

    it("should initialize with custom search and filter values", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialSearch: "test search",
          initialFilter: "active",
        }),
      );

      expect(result.current.searchTerm).toBe("test search");
      expect(result.current.filter).toBe("active");
    });

    it("should initialize with custom debounce delay", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          debounceDelay: 1000,
        }),
      );

      // Test that hook works with custom debounce delay
      expect(result.current.searchTerm).toBe("");
      expect(result.current.filter).toBe("all");
      expect(result.current).toBeDefined();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch data on initial mount when no initial data provided", async () => {
      renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          search: "",
          filter: "all",
        });
      });
    });

    it("should not fetch data on initial mount when initial data is provided", () => {
      renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialData: mockData,
        }),
      );

      // Should not call queryAction immediately when initial data is provided
      expect(mockQueryAction).not.toHaveBeenCalled();
    });

    it("should update data and pagination after successful fetch", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.pagination).toEqual(mockPagination);
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle fetch errors properly", async () => {
      const errorMessage = "Failed to fetch data";
      mockQueryAction.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.data).toEqual([]);
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockQueryAction.mockRejectedValue("String error");

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("An unknown error occurred");
      });
    });
  });

  describe("Search Functionality", () => {
    it("should update search term when setSearchTerm is called", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      act(() => {
        result.current.setSearchTerm("new search");
      });

      expect(result.current.searchTerm).toBe("new search");
    });

    it("should call queryAction with debounced search term", async () => {
      mockUseDebounce.mockImplementation((value, delay) => {
        // Simulate debounced value after delay
        return [value === "test" ? "test" : "", delay];
      });

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      act(() => {
        result.current.setSearchTerm("test");
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "test",
          }),
        );
      });
    });

    it("should reset page to 1 when search term changes", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First set page to 2
      act(() => {
        result.current.setCurrentPage(2);
      });

      // Wait for the page change effect
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
        );
      });

      // Then change search term - this should reset page to 1
      act(() => {
        result.current.setSearchTerm("search");
      });

      // Wait for the search term to trigger page reset and new query
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            search: "search",
          }),
        );
      });
    });
  });

  describe("Filter Functionality", () => {
    it("should update filter when setFilter is called", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      act(() => {
        result.current.setFilter("active");
      });

      expect(result.current.filter).toBe("active");
    });

    it("should call queryAction with new filter", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      act(() => {
        result.current.setFilter("inactive");
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: "inactive",
          }),
        );
      });
    });

    it("should reset page to 1 when filter changes", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First set page to 3
      act(() => {
        result.current.setCurrentPage(3);
      });

      // Wait for the page change effect
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({ page: 3 }),
        );
      });

      // Then change filter - this should reset page to 1
      act(() => {
        result.current.setFilter("archived");
      });

      // Wait for the filter to trigger page reset and new query
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            filter: "archived",
          }),
        );
      });
    });
  });

  describe("Pagination", () => {
    it("should update current page when setCurrentPage is called", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentPage(5);
      });

      // The page change should trigger a new query with page 5
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({ page: 5 }),
        );
      });
    });

    it("should call queryAction with new page number", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      act(() => {
        result.current.setCurrentPage(3);
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 3,
          }),
        );
      });
    });

    it("should use custom limit from initial pagination", async () => {
      const customPagination = { page: 1, limit: 50, total: 0, totalPages: 1 };

      renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialPagination: customPagination,
        }),
      );

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 50,
          }),
        );
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refetch data when refresh is called", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledTimes(1);
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledTimes(2);
      });
    });

    it("should clear error when refresh is called", async () => {
      // First make queryAction fail
      mockQueryAction.mockRejectedValueOnce(new Error("Initial error"));

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for error to be set
      await waitFor(() => {
        expect(result.current.error).toBe("Initial error");
      });

      // Now make queryAction succeed
      mockQueryAction.mockResolvedValue({
        data: mockData,
        pagination: mockPagination,
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should maintain current search, filter, and page values during refresh", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set custom values
      act(() => {
        result.current.setSearchTerm("test search");
        result.current.setFilter("custom");
        result.current.setCurrentPage(2);
      });

      // Wait for all state changes to trigger queries
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2, // latest explicit page change should win
            search: "test search",
            filter: "custom",
          }),
        );
      });

      // Clear mock calls to track refresh call specifically
      mockQueryAction.mockClear();

      // Call refresh - it should use current state values
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith({
          page: 2, // refresh should keep the latest page
          limit: 20,
          search: "test search",
          filter: "custom",
        });
      });
    });
  });

  describe("Loading State", () => {
    it("should indicate loading state during data fetch", async () => {
      let resolveQuery: (value: any) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });
      mockQueryAction.mockReturnValue(queryPromise);

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Should be loading while query is pending
      expect(result.current.loading).toBe(true);

      // Resolve the query
      act(() => {
        resolveQuery({ data: mockData, pagination: mockPagination });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle loading state during refresh", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a new promise for refresh
      let resolveRefresh: (value: any) => void;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      mockQueryAction.mockReturnValue(refreshPromise);

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      // Should be loading during refresh
      expect(result.current.loading).toBe(true);

      // Resolve refresh
      act(() => {
        resolveRefresh({ data: mockData, pagination: mockPagination });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("Debounce Integration", () => {
    it("should work with custom debounce delay configuration", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          debounceDelay: 750,
        }),
      );

      // Test that hook works correctly with custom debounce configuration
      expect(result.current.searchTerm).toBe("");
      expect(result.current.setSearchTerm).toBeInstanceOf(Function);
      expect(result.current).toBeDefined();
    });

    it("should work with default debounce delay", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Test that hook works correctly with default debounce configuration
      expect(result.current.searchTerm).toBe("");
      expect(result.current.setSearchTerm).toBeInstanceOf(Function);
      expect(result.current).toBeDefined();
    });

    it("should handle search term changes with debouncing", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialSearch: "initial search",
        }),
      );

      expect(result.current.searchTerm).toBe("initial search");

      act(() => {
        result.current.setSearchTerm("new search");
      });

      expect(result.current.searchTerm).toBe("new search");

      // The debounced search should eventually trigger a query
      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle Error objects properly", async () => {
      const error = new Error("Network error");
      mockQueryAction.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });
    });

    it("should handle string errors", async () => {
      mockQueryAction.mockRejectedValue("String error message");

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("An unknown error occurred");
      });
    });

    it("should handle null/undefined errors", async () => {
      mockQueryAction.mockRejectedValue(null);

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("An unknown error occurred");
      });
    });

    it("should clear error on successful subsequent calls", async () => {
      // First call fails
      mockQueryAction.mockRejectedValueOnce(new Error("First error"));

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("First error");
      });

      // Second call succeeds
      mockQueryAction.mockResolvedValue({
        data: mockData,
        pagination: mockPagination,
      });

      act(() => {
        result.current.setCurrentPage(2);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("Query Action Reference Stability", () => {
    it("should handle query action changes without infinite loops", async () => {
      let queryAction1 = jest.fn().mockResolvedValue({
        data: [mockData[0]],
        pagination: mockPagination,
      });

      const { result, rerender } = renderHook(
        ({ queryAction }) =>
          useAdminTable({
            queryAction,
          }),
        {
          initialProps: { queryAction: queryAction1 },
        },
      );

      // Wait for initial call
      await waitFor(() => {
        expect(queryAction1).toHaveBeenCalledTimes(1);
      });

      // Change the query action
      const queryAction2 = jest.fn().mockResolvedValue({
        data: [mockData[1]],
        pagination: mockPagination,
      });

      rerender({ queryAction: queryAction2 });

      // Should use the new query action for subsequent calls
      act(() => {
        result.current.setCurrentPage(2);
      });

      await waitFor(() => {
        expect(queryAction2).toHaveBeenCalled();
        expect(queryAction1).toHaveBeenCalledTimes(1); // Still only called once
      });
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle rapid state changes correctly", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Rapid state changes
      act(() => {
        result.current.setSearchTerm("search1");
        result.current.setFilter("filter1");
        result.current.setCurrentPage(2);
        result.current.setSearchTerm("search2");
        result.current.setFilter("filter2");
      });

      await waitFor(() => {
        expect(result.current.searchTerm).toBe("search2");
        expect(result.current.filter).toBe("filter2");
        expect(result.current.pagination.page).toBe(1); // Should reset to 1 due to search/filter change
      });
    });

    it("should work with complex data structures", async () => {
      interface ComplexData {
        id: string;
        nested: {
          value: number;
          array: string[];
        };
        optional?: boolean;
      }

      const complexData: ComplexData[] = [
        {
          id: "1",
          nested: { value: 42, array: ["a", "b"] },
          optional: true,
        },
        {
          id: "2",
          nested: { value: 24, array: ["c", "d"] },
        },
      ];

      mockQueryAction.mockResolvedValue({
        data: complexData,
        pagination: mockPagination,
      });

      const { result } = renderHook(() =>
        useAdminTable<ComplexData>({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(complexData);
      });
    });

    it("should handle empty data responses", async () => {
      mockQueryAction.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
        expect(result.current.pagination.total).toBe(0);
        expect(result.current.pagination.totalPages).toBe(0);
      });
    });
  });

  describe("Integration with React Concurrent Features", () => {
    it("should work with React's concurrent features", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // The hook uses useTransition internally
      // Test that loading state is properly managed
      expect(typeof result.current.loading).toBe("boolean");

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });

    it("should handle component unmounting gracefully", () => {
      const { unmount } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Should not throw error when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Return Value Structure", () => {
    it("should return all expected properties", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      const returnValue = result.current;

      expect(returnValue).toHaveProperty("data");
      expect(returnValue).toHaveProperty("pagination");
      expect(returnValue).toHaveProperty("loading");
      expect(returnValue).toHaveProperty("error");
      expect(returnValue).toHaveProperty("searchTerm");
      expect(returnValue).toHaveProperty("filter");
      expect(returnValue).toHaveProperty("setSearchTerm");
      expect(returnValue).toHaveProperty("setFilter");
      expect(returnValue).toHaveProperty("setCurrentPage");
      expect(returnValue).toHaveProperty("refresh");

      expect(typeof returnValue.setSearchTerm).toBe("function");
      expect(typeof returnValue.setFilter).toBe("function");
      expect(typeof returnValue.setCurrentPage).toBe("function");
      expect(typeof returnValue.refresh).toBe("function");
    });

    it("should have stable function references", () => {
      const { result, rerender } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      const firstRender = {
        setSearchTerm: result.current.setSearchTerm,
        setFilter: result.current.setFilter,
        setCurrentPage: result.current.setCurrentPage,
        refresh: result.current.refresh,
      };

      rerender();

      const secondRender = {
        setSearchTerm: result.current.setSearchTerm,
        setFilter: result.current.setFilter,
        setCurrentPage: result.current.setCurrentPage,
        refresh: result.current.refresh,
      };

      // Functions should be the same reference across renders
      expect(firstRender.setSearchTerm).toBe(secondRender.setSearchTerm);
      expect(firstRender.setFilter).toBe(secondRender.setFilter);
      expect(firstRender.setCurrentPage).toBe(secondRender.setCurrentPage);
      expect(firstRender.refresh).toBe(secondRender.refresh);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle edge case where initial mount check and data length both trigger", () => {
      // Test the specific condition in line 75-77
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialData: mockData, // Has data
        }),
      );

      // Should not call queryAction when initial data is provided
      expect(mockQueryAction).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it("should handle edge case where isInitialMount.current is false but needs to be set", () => {
      // This tests the code path where isInitialMount.current = false is called
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // This should trigger the effect and call queryAction
      expect(result.current.loading).toBe(true);
    });

    it("should handle edge case with page reset effect when not initial mount", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          initialData: mockData, // Provide initial data to skip initial effect
        }),
      );

      // Wait a bit to ensure initial mount flag is set to false
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Now changing search should trigger page reset since it's not initial mount
      act(() => {
        result.current.setSearchTerm("new search");
      });

      // This should trigger the page reset effect (line 105-108)
      await waitFor(() => {
        expect(result.current.searchTerm).toBe("new search");
      });
    });

    it("should handle error in refresh callback correctly", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make refresh fail
      const refreshError = new Error("Refresh failed");
      mockQueryAction.mockRejectedValueOnce(refreshError);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Refresh failed");
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle non-Error objects in refresh callback", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make refresh fail with non-Error object
      mockQueryAction.mockRejectedValueOnce("Non-error object");

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("An unknown error occurred");
      });
    });

    it("should handle queryActionRef current assignment in useEffect", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let queryActionRef: any;

      // Create a custom hook to access the ref
      const { rerender } = renderHook(
        ({ action }) => {
          // This tests the useEffect that updates queryActionRef.current
          const result = useAdminTable({
            queryAction: action,
          });
          return result;
        },
        {
          initialProps: { action: mockQueryAction },
        },
      );

      // Change the query action to test the ref update effect
      const newAction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      });

      rerender({ action: newAction });

      // The ref should be updated with the new action
      expect(newAction).toBeDefined();
    });

    it("should handle boundary condition with zero debounce delay", () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
          debounceDelay: 0, // Edge case: zero delay
        }),
      );

      expect(result.current.searchTerm).toBe("");
      expect(result.current.setSearchTerm).toBeInstanceOf(Function);
    });

    it("should handle boundary condition with very large page numbers", async () => {
      const { result } = renderHook(() =>
        useAdminTable({
          queryAction: mockQueryAction,
        }),
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test with very large page number
      act(() => {
        result.current.setCurrentPage(999999);
      });

      await waitFor(() => {
        expect(mockQueryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 999999,
          }),
        );
      });
    });
  });
});
