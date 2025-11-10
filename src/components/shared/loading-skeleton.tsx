import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCard() {
  return (
    <div className="retro-card p-6 space-y-4">
      <Skeleton className="h-8 w-3/4 bg-muted" />
      <Skeleton className="h-4 w-1/2 bg-muted" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full bg-muted" />
        <Skeleton className="h-12 w-full bg-muted" />
        <Skeleton className="h-12 w-full bg-muted" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="retro-card p-6">
      <Skeleton className="h-8 w-1/3 bg-muted mb-4" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function LoadingStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="retro-card p-4">
          <Skeleton className="h-6 w-24 bg-muted mb-2" />
          <Skeleton className="h-10 w-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
