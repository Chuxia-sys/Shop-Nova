import { SkeletonCard } from "@/components/shared/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 py-6">
        {/* Breadcrumbs skeleton */}
        <Skeleton className="mb-6 h-4 w-48" />

        {/* Title skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card/50 p-5 backdrop-blur-sm">
                <Skeleton className="mb-6 h-5 w-20" />
                <Skeleton className="mb-3 h-4 w-16" />
                <Skeleton className="mb-4 h-9 w-full" />
                <Skeleton className="mb-3 h-4 w-24" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-4 w-full" />
                ))}
                <Skeleton className="mt-4 mb-3 h-4 w-20" />
                <Skeleton className="mb-4 h-6 w-full" />
                <Skeleton className="mb-3 h-4 w-16" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-4 w-full" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Toolbar skeleton */}
            <div className="mb-6 flex items-center justify-between rounded-xl border bg-card/50 p-3 backdrop-blur-sm">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-40" />
            </div>

            {/* Product grid skeleton */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
