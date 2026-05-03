import {
  searchProducts,
  getCategories,
  getBreadcrumbPath,
  type SearchParams as ApiSearchParams,
} from '@/lib/api';
import { parseSearchParams } from '@/lib/searchParams';
import { SearchBox } from '@/components/SearchBox';
import { Filters } from '@/components/Filters';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Home({ searchParams }: PageProps) {
  const parsed: ApiSearchParams = parseSearchParams(searchParams);

  const [data, categories] = await Promise.all([
    searchProducts(parsed),
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
  ]);

  const categoryFilter = parsed.filters?.categories;
  const firstCategoryId =
    Array.isArray(categoryFilter) ? categoryFilter[0] : categoryFilter;
  const categoryPath = firstCategoryId
    ? getBreadcrumbPath(categories, Number(firstCategoryId))
    : [];

  const crumbs: Crumb[] = [{ label: 'Etusivu', href: '/' }];
  if (categoryPath.length) {
    for (const c of categoryPath) {
      crumbs.push({ label: c.name, href: `/?categories=${c.id}` });
    }
  }
  if (parsed.text) crumbs.push({ label: `Haku: "${parsed.text}"` });

  return (
    <div className="space-y-5">
      {crumbs.length > 1 && <Breadcrumbs items={crumbs} />}

      <SearchBox />

      <div className="text-xs text-muted uppercase tracking-wider">
        {parsed.text ? <>"{parsed.text}" · </> : null}
        {data.total.toLocaleString('fi-FI')} tulosta
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-x-8 gap-y-4">
        <Filters filters={data.available_filters} />

        <section>
          {data.data.length === 0 ? (
            <div className="text-center py-20 text-muted">Ei tuloksia.</div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {data.data.map((p) => (
                <li key={p.id}>
                  <ProductCard p={p} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={data.current_page} lastPage={data.last_page} />
        </section>
      </div>
    </div>
  );
}
