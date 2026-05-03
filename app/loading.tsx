import { FiltersSkeleton, ProductGridSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-12 skeleton rounded-md" />
      <div className="h-3 skeleton rounded w-32" />
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-x-8 gap-y-4">
        <div className="hidden md:block"><FiltersSkeleton /></div>
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
