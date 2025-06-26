"use client";

import {
  useState,
  useEffect,
  ReactNode,
  memo,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { generateA11yId } from "@/lib/utils/accessibility";

interface TableColumn<T> {
  key: string;
  label: string | ReactNode;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminTableBaseProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

// Simple skeleton component
const TableSkeleton = memo(({ columnCount }: { columnCount: number }) => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow
        key={`skeleton-${i}`}
        role="row"
        aria-label={`Loading row ${i + 1}`}
      >
        {Array.from({ length: columnCount }).map((_, j) => (
          <TableCell key={`skeleton-cell-${j}`} role="cell">
            <div
              className="bg-muted h-4 w-full animate-pulse rounded"
              aria-label="Loading content"
              role="status"
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
));

TableSkeleton.displayName = "TableSkeleton";

// Simple empty state component
const EmptyState = memo(
  ({ columnCount, message }: { columnCount: number; message: string }) => (
    <TableRow role="row">
      <TableCell
        colSpan={columnCount}
        className="h-24 text-center"
        role="cell"
        aria-label={`Empty state: ${message}`}
      >
        <div role="status" aria-live="polite">
          {message}
        </div>
      </TableCell>
    </TableRow>
  ),
);

EmptyState.displayName = "EmptyState";

// Pagination button component
const PaginationButton = memo(
  ({
    pageNumber,
    currentPage,
    loading,
    onClick,
  }: {
    pageNumber: number;
    currentPage: number;
    loading: boolean;
    onClick: (page: number) => void;
  }) => {
    const handleClick = useCallback(() => {
      onClick(pageNumber);
    }, [onClick, pageNumber]);

    const isCurrent = currentPage === pageNumber;

    return (
      <Button
        variant={isCurrent ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={loading}
        aria-label={`Go to page ${pageNumber}`}
        aria-current={isCurrent ? "page" : undefined}
        aria-pressed={isCurrent}
      >
        {pageNumber}
      </Button>
    );
  },
);

PaginationButton.displayName = "PaginationButton";

function AdminTableBaseComponent<T extends { id: string | number }>({
  columns,
  data,
  loading,
  error,
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = "Filter...",
  pagination,
  onPageChange,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
}: AdminTableBaseProps<T>) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Generate stable IDs for accessibility
  const searchLabelId = useMemo(() => generateA11yId("search-label"), []);
  const tableCaptionId = useMemo(() => generateA11yId("table-caption"), []);
  const filterLabelId = useMemo(() => generateA11yId("filter-label"), []);
  const paginationId = useMemo(() => generateA11yId("pagination"), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchTerm !== searchTerm) {
        onSearchChange(debouncedSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, onSearchChange, searchTerm]);

  // Update internal state when external searchTerm changes
  useEffect(() => {
    setDebouncedSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = useCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, []);

  // Memoize pagination calculations
  const paginationInfo = useMemo(() => {
    const startItem = (pagination.page - 1) * pagination.limit + 1;
    const endItem = Math.min(
      pagination.page * pagination.limit,
      pagination.total,
    );
    const showPagination = pagination.totalPages > 1;

    return {
      startItem,
      endItem,
      showPagination,
      total: pagination.total,
    };
  }, [
    pagination.page,
    pagination.limit,
    pagination.total,
    pagination.totalPages,
  ]);

  // Memoize pagination buttons
  const paginationButtons = useMemo(() => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    // Calculate visible page range
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if end page is at the limit
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i,
    );
  }, [pagination.totalPages, pagination.page]);

  // Memoize navigation handlers
  const handlePreviousPage = useCallback(() => {
    if (pagination.page > 1) {
      onPageChange(pagination.page - 1);
    }
  }, [pagination.page, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      onPageChange(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, onPageChange]);

  // Memoize table rows to avoid re-rendering on every change
  const tableRows = useMemo(() => {
    return data.map((item, rowIndex) => (
      <TableRow
        key={item.id}
        role="row"
        aria-rowindex={rowIndex + 2}
        tabIndex={0}
        aria-label={`Row ${rowIndex + 1} of ${data.length}`}
      >
        {columns.map((column, colIndex) => (
          <TableCell
            key={column.key}
            role="cell"
            aria-describedby={`${tableCaptionId}-col-${colIndex}`}
          >
            {column.render
              ? column.render(item)
              : column.key in item
                ? String(item[column.key as keyof T])
                : ""}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [data, columns, tableCaptionId]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Data table with search and pagination"
    >
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <label htmlFor={searchLabelId} className="sr-only">
            Search table data
          </label>
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id={searchLabelId}
            placeholder={searchPlaceholder}
            value={debouncedSearchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            aria-label={`Search table data. Current search: ${debouncedSearchTerm || "none"}`}
            role="searchbox"
          />
        </div>
        {filterOptions && onFilterChange && (
          <div>
            <label htmlFor={filterLabelId} className="sr-only">
              Filter table data
            </label>
            <Select value={filterValue} onValueChange={onFilterChange}>
              <SelectTrigger
                className="w-[180px]"
                id={filterLabelId}
                aria-label="Filter table data"
              >
                <SelectValue placeholder={filterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table
          role="table"
          aria-labelledby={tableCaptionId}
          aria-rowcount={loading ? -1 : data.length + 1}
          aria-busy={loading}
        >
          <caption id={tableCaptionId} className="sr-only">
            Data table with {data.length} rows and {columns.length} columns.
            {loading && "Loading data. "}
            {debouncedSearchTerm &&
              `Filtered by search: "${debouncedSearchTerm}". `}
            {filterValue && `Filtered by: ${filterValue}. `}
            Page {pagination.page} of {pagination.totalPages}.
          </caption>
          <TableHeader>
            <TableRow role="row">
              {columns.map((column, index) => (
                <TableHead
                  key={String(column.key)}
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={column.sortable ? "none" : undefined}
                  aria-label={`Column ${index + 1}: ${typeof column.label === "string" ? column.label : `Column ${column.key}`}`}
                >
                  {typeof column.label === "string"
                    ? column.label
                    : column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columnCount={columns.length} />
            ) : data.length === 0 ? (
              <EmptyState columnCount={columns.length} message={emptyMessage} />
            ) : (
              <>{tableRows}</>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationInfo.showPagination && (
        <nav
          id={paginationId}
          role="navigation"
          aria-label="Table pagination"
          className="flex items-center justify-between"
        >
          <div
            className="text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing {paginationInfo.startItem} to {paginationInfo.endItem} of{" "}
            {paginationInfo.total} results
          </div>
          <div
            className="flex items-center space-x-2"
            role="group"
            aria-label="Pagination controls"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pagination.page <= 1 || loading}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <div
              className="flex items-center space-x-1"
              role="group"
              aria-label="Page numbers"
            >
              {paginationButtons.map((pageNumber) => (
                <PaginationButton
                  key={pageNumber}
                  pageNumber={pageNumber}
                  currentPage={pagination.page}
                  loading={loading}
                  onClick={onPageChange}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.totalPages || loading}
              aria-label="Go to next page"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

// Export memoized version with proper generic typing
export const AdminTableBase = memo(AdminTableBaseComponent) as <
  T extends { id: string | number },
>(
  props: AdminTableBaseProps<T>,
) => ReactNode;
