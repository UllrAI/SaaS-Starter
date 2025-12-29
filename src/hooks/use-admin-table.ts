"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useDebounce } from "use-debounce";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminTableQueryArgs {
  page: number;
  limit: number;
  search?: string;
  filter?: string;
  [key: string]: unknown;
}

interface UseAdminTableProps<T> {
  queryAction: (
    args: AdminTableQueryArgs,
  ) => Promise<{ data: T[]; pagination: Pagination }>;
  initialData?: T[];
  initialPagination?: Pagination;
  initialSearch?: string;
  initialFilter?: string;
  debounceDelay?: number;
}

interface UseAdminTableReturn<T> {
  data: T[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filter: string;
  setSearchTerm: (term: string) => void;
  setFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
  refresh: () => void;
}

export function useAdminTable<T>({
  queryAction,
  initialData = [],
  initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  initialSearch = "",
  initialFilter = "all",
  debounceDelay = 500,
}: UseAdminTableProps<T>): UseAdminTableReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceDelay);
  const [isPending, startTransition] = useTransition();

  const isInitialMount = useRef(true);

  // FIX: Store queryAction in a ref to maintain a stable reference
  const queryActionRef = useRef(queryAction);
  useEffect(() => {
    queryActionRef.current = queryAction;
  }, [queryAction]);

  // FIX: Major change here to fix the infinite loop
  useEffect(() => {
    // Skip fetch on initial mount if we already have data
    if (isInitialMount.current && initialData.length > 0) {
      isInitialMount.current = false;
      return;
    }

    // Set initial mount to false after the first run
    isInitialMount.current = false;

    startTransition(async () => {
      setError(null);
      try {
        const result = await queryActionRef.current({
          page: currentPage,
          limit: initialPagination.limit,
          search: debouncedSearchTerm,
          filter: filter,
        });
        setData(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    });
    // FIX: The dependency array is now stable and correct.
  }, [
    currentPage,
    debouncedSearchTerm,
    filter,
    initialPagination.limit,
    initialData.length,
  ]);

  // Reset page to 1 when search or filter changes
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const updateFilter = useCallback((nextFilter: string) => {
    setFilter(nextFilter);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await queryActionRef.current({
          page: currentPage,
          limit: initialPagination.limit,
          search: debouncedSearchTerm,
          filter: filter,
        });
        setData(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    });
  }, [currentPage, debouncedSearchTerm, filter, initialPagination.limit]);

  return {
    data,
    pagination,
    loading: isPending,
    error,
    searchTerm,
    filter,
    setSearchTerm: updateSearchTerm,
    setFilter: updateFilter,
    setCurrentPage,
    refresh,
  };
}
