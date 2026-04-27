import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="w-full space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`r-${r}-c-${c}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
