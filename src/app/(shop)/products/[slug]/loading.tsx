import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 py-6">
        {/* Breadcrumbs */}
        <Skeleton className="mb-6 h-4 w-64" />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image gallery skeleton */}
          <div>
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="mt-4 flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-3/4" />
            <div className="mb-4 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-full" />
              ))}
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="mb-6 h-4 w-32" />
            <Skeleton className="mb-8 h-20 w-full" />

            <div className="mb-6 space-y-3">
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-14 rounded-lg" />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>

            <div className="mt-8 space-y-4 border-t pt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-12">
          <div className="flex gap-6 border-b">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-8 w-24" />
            ))}
          </div>
          <div className="mt-6">
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="mb-2 h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        </div>

        {/* Related products skeleton */}
        <div className="mt-16">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card">
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
    </div>
  );
}
