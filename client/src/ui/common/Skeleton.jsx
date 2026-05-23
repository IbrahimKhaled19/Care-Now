export default function Skeleton({ className = "", count = 1 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-100 rounded-lg ${className}`}
        />
      ))}
    </>
  );
}

export function ChartSkeleton({ height = "320px" }) {
  return (
    <div style={{ height }} className="flex flex-col gap-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="flex-1 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}
