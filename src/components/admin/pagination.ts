export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): number[] {
  if (totalPages <= 0 || maxVisible <= 0) return [];

  const visibleCount = Math.min(totalPages, maxVisible);
  const boundedCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startPage = Math.min(
    Math.max(boundedCurrentPage - Math.floor(visibleCount / 2), 1),
    totalPages - visibleCount + 1,
  );

  return Array.from({ length: visibleCount }, (_, index) => startPage + index);
}
