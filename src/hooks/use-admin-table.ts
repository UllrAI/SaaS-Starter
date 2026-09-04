"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useDebounce } from "use-debounce";

import { useDeploymentSkewGuard } from "@/hooks/use-deployment-skew";

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
  error: boolean;
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
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceDelay);
  const [isPending, startTransition] = useTransition();
  const guardSkew = useDeploymentSkewGuard();

  const isInitialMount = useRef(true);

  // Keep the latest action without changing callback identity.
  const queryActionRef = useRef(queryAction);
  useEffect(() => {
    queryActionRef.current = queryAction;
  }, [queryAction]);

  const loadPage = useCallback(async () => {
    setError(false);
    try {
      const result = await guardSkew(() =>
        queryActionRef.current({
          page: currentPage,
          limit: initialPagination.limit,
          search: debouncedSearchTerm,
          filter: filter,
        }),
      );
      // `undefined` means the deployment moved under this page. The guard has
      // already prompted for a reload, so keep the rows currently on screen.
      if (!result) return;
      setData(result.data);
      setPagination(result.pagination);
    } catch (cause) {
      // Skew is handled by the guard above, so anything landing here is a real
      // failure worth leaving a trace of.
      console.error(cause);
      setError(true);
    }
    // Depends on the query inputs, not on the caller's `queryAction`
    // identity, which is read through a ref instead.
  }, [
    currentPage,
    debouncedSearchTerm,
    filter,
    guardSkew,
    initialPagination.limit,
  ]);

  useEffect(() => {
    // Skip fetch on initial mount if we already have data
    if (isInitialMount.current && initialData.length > 0) {
      isInitialMount.current = false;
      return;
    }

    // Set initial mount to false after the first run
    isInitialMount.current = false;

    startTransition(async () => {
      await loadPage();
    });
  }, [loadPage, initialData.length]);

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
      await loadPage();
    });
  }, [loadPage]);

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
