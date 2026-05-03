import { searchProducts, type Category } from '@/lib/api';
import { ProductCard } from './ProductCard';

type Props = {
  categoryId?: number | null;
  excludeId: string | number;
  limit?: number;
  categories?: Category[];
};

export async function SimilarItems({ categoryId, excludeId, limit = 8, categories }: Props) {
  if (!categoryId) return null;

  let products;
  try {
    const data = await searchProducts({
      filters: { categories: [String(categoryId)] },
      perPage: limit + 4,
    });
    products = data.data.filter((p) => String(p.id) !== String(excludeId)).slice(0, limit);
  } catch {
    return null;
  }

  if (!products.length) return null;

  return (
    <section className="md:col-span-2 mt-10">
      <h2 className="text-xs uppercase tracking-wider text-muted mb-4">Samasta kategoriasta</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard p={p} categories={categories} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SimilarItemsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="md:col-span-2 mt-10">
      <div className="h-3 skeleton rounded w-32 mb-4" />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <div className="aspect-square skeleton rounded-md" />
            <div className="pt-2 space-y-1.5">
              <div className="h-3 skeleton rounded w-11/12" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
