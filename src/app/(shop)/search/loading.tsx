import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 py-6">
        {/* Breadcrumbs skeleton */}
        <Skeleton className="mb-6 h-4 w-48" />

        {/* Search header */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-10 w-48" />
          <Skeleton className="mb-4 h-5 w-72" />
          <Skeleton className="h-12 w-full max-w-xl rounded-full" />
        </div>

        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Search results skeleton */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card/50">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
