import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/shared/glass-card";

export default function DashboardLoading() {
  return (
    <div className="container px-4 py-8">
      <Skeleton className="mb-8 h-9 w-48" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </GlassCard>
        <GlassCard className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </GlassCard>
      </div>
    </div>
  );
}
