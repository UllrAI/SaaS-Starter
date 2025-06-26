"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useDebounce } from "use-debounce";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Base interface for admin table query arguments
interface BaseAdminTableQueryArgs {
  page: number;
  limit: number;
  search?: string;
  filter?: string;
}

// Generic interface that allows extending with specific query parameters
type AdminTableQueryArgs<TExtensions = Record<string, never>> =
  BaseAdminTableQueryArgs & TExtensions;

interface UseAdminTableProps<T, TQueryExtensions = Record<string, never>> {
  queryAction: (
    args: AdminTableQueryArgs<TQueryExtensions>,
  ) => Promise<{ data: T[]; pagination: Pagination }>;
  initialData?: T[];
  initialPagination?: Pagination;
  initialSearch?: string;
  initialFilter?: string;
  debounceDelay?: number;
  // Optional additional query parameters
  additionalQueryParams?: TQueryExtensions;
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

export function useAdminTable<T, TQueryExtensions = Record<string, never>>({
  queryAction,
  initialData = [],
  initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  initialSearch = "",
  initialFilter = "all",
  debounceDelay = 500,
  additionalQueryParams = {} as TQueryExtensions,
}: UseAdminTableProps<T, TQueryExtensions>): UseAdminTableReturn<T> {
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
          ...additionalQueryParams,
        } as AdminTableQueryArgs<TQueryExtensions>);
        setData(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    });
    // FIX: The dependency array is now stable and correct.
  }, [currentPage, debouncedSearchTerm, filter, initialPagination.limit]);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    if (!isInitialMount.current) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, filter]);

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await queryActionRef.current({
          page: currentPage,
          limit: initialPagination.limit,
          search: debouncedSearchTerm,
          filter: filter,
          ...additionalQueryParams,
        } as AdminTableQueryArgs<TQueryExtensions>);
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
    setSearchTerm,
    setFilter,
    setCurrentPage,
    refresh,
  };
}
