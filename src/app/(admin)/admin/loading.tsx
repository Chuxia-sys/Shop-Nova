import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar skeleton */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
        <div className="p-4">
          <Skeleton className="mb-6 h-8 w-32" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
