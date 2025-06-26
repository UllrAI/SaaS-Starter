"use client";

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the large UploadManagementTable component
const UploadManagementTable = lazy(() =>
  import("./upload-management-table").then((module) => ({
    default: module.UploadManagementTable,
  })),
);

// Loading skeleton for the upload management table
function UploadTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filter controls skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Table rows skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4">
            <div className="grid grid-cols-6 gap-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <div className="flex space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

// Upload type definition
interface Upload {
  id: string;
  userId: string;
  fileKey: string;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
}

// Pagination type definition
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Props type for the lazy component
interface LazyUploadManagementTableProps {
  initialData: Upload[];
  initialPagination: PaginationData;
}

// Lazy-loaded Upload Management Table with proper error boundary
export function LazyUploadManagementTable({
  initialData,
  initialPagination,
}: LazyUploadManagementTableProps) {
  return (
    <Suspense fallback={<UploadTableSkeleton />}>
      <UploadManagementTable
        initialData={initialData}
        initialPagination={initialPagination}
      />
    </Suspense>
  );
}
