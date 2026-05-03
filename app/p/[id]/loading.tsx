export default function Loading() {
  return (
    <article className="grid md:grid-cols-2 gap-8">
      <div className="aspect-square skeleton rounded-md" />
      <div className="space-y-4">
        <div className="h-6 skeleton rounded w-5/6" />
        <div className="h-6 skeleton rounded w-2/3" />
        <div className="h-9 skeleton rounded w-32 mt-4" />
        <div className="h-3 skeleton rounded w-40" />
        <div className="h-12 skeleton rounded-md mt-4" />
        <div className="space-y-2 pt-4">
          <div className="h-3 skeleton rounded" />
          <div className="h-3 skeleton rounded w-11/12" />
          <div className="h-3 skeleton rounded w-10/12" />
          <div className="h-3 skeleton rounded w-9/12" />
        </div>
      </div>
    </article>
  );
}
