export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-square skeleton rounded-md" />
      <div className="pt-2 space-y-2">
        <div className="h-3 skeleton rounded w-11/12" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="h-4 skeleton rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}><ProductCardSkeleton /></li>
      ))}
    </ul>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-3 skeleton rounded w-20" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 skeleton rounded w-2/3" />
          <div className="h-3 skeleton rounded w-1/2" />
          <div className="h-3 skeleton rounded w-3/4" />
          <div className="h-3 skeleton rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
