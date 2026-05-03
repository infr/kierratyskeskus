import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  searchProducts,
  getCategories,
  getBreadcrumbPath,
  type Category,
  type SearchParams as ApiSearchParams,
} from '@/lib/api';
import { findCategoryBySlug, getChildren, categoryHref } from '@/lib/categories';
import { parseSearchParams } from '@/lib/searchParams';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';
import { SearchBox } from '@/components/SearchBox';
import { Filters } from '@/components/Filters';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { RecentSearches } from '@/components/RecentSearches';
import { JsonLd } from '@/components/JsonLd';
import { FiltersSkeleton, ProductGridSkeleton } from '@/components/Skeleton';

// /info, /p/[id], /api/* are explicit routes and take precedence over [slug],
// so this route only catches single-segment paths that aren't otherwise mapped.
const RESERVED_SLUGS = new Set([
  'info',
  'p',
  'api',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
]);

type PageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

async function resolveCategory(slug: string): Promise<{ category: Category; categories: Category[] } | null> {
  if (RESERVED_SLUGS.has(slug)) return null;
  const categories = await getCategories().catch(() => [] as Category[]);
  const category = findCategoryBySlug(categories, slug);
  if (!category) return null;
  return { category, categories };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolved = await resolveCategory(params.slug);
  if (!resolved) return { title: 'Kategoriaa ei löytynyt', robots: { index: false, follow: false } };
  const { category } = resolved;
  const parsed = parseSearchParams(searchParams);
  const page = parsed.page && parsed.page > 1 ? ` · sivu ${parsed.page}` : '';

  const title = `${category.name}${page} | ${SITE_NAME}`;
  const description = `${category.name} kauppa.kierratyskeskus.fi-sivuston tuotteet. Selaa ja suodata mobiilissa.`;
  const canonical = `${SITE_URL}${categoryHref(category.slug)}${parsed.page && parsed.page > 1 ? `?page=${parsed.page}` : ''}`;

  return {
    title: { absolute: title },
    description,
    openGraph: { type: 'website', title, description, siteName: SITE_NAME, locale: 'fi_FI', url: canonical },
    twitter: { card: 'summary', title, description },
    robots: parsed.page && parsed.page > 1 ? { index: false, follow: true } : { index: true, follow: true },
    other: { 'og:url': canonical },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolved = await resolveCategory(params.slug);
  if (!resolved) notFound();
  const { category, categories } = resolved;

  const baseParsed: ApiSearchParams = parseSearchParams(searchParams);
  const parsed: ApiSearchParams = {
    ...baseParsed,
    filters: { ...(baseParsed.filters ?? {}), categories: [String(category.id)] },
  };

  const path = getBreadcrumbPath(categories, category.id);
  const children = getChildren(categories, category.id);

  const crumbs: Crumb[] = [
    { label: 'Etusivu', href: '/' },
    ...path.map((c, i) => ({
      label: c.name,
      href: i === path.length - 1 ? undefined : categoryHref(c.slug),
    })),
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.href ? absoluteUrl(c.href) : absoluteUrl(categoryHref(category.slug)),
    })),
  };

  const canonical = `${SITE_URL}${categoryHref(category.slug)}${parsed.page && parsed.page > 1 ? `?page=${parsed.page}` : ''}`;
  const resultsKey = JSON.stringify({ slug: category.slug, ...searchParams });

  return (
    <div className="space-y-5">
      <link rel="canonical" href={canonical} />
      <Breadcrumbs items={crumbs} />

      <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>

      <SearchBox />

      <RecentSearches />

      {children.length > 0 && (
        <nav aria-label="Alikategoriat" className="flex flex-wrap gap-2">
          {children.map((c) => (
            <a
              key={c.id}
              href={categoryHref(c.slug)}
              className="text-sm rounded-full bg-white ring-1 ring-black/5 px-3 py-1.5 hover:bg-paper hover:ring-black/10"
            >
              {c.name}
            </a>
          ))}
        </nav>
      )}

      <Suspense key={resultsKey} fallback={<ResultsSkeleton />}>
        <Results parsed={parsed} categories={categories} activeCategoryId={category.id} />
      </Suspense>

      <JsonLd data={breadcrumbJsonLd} />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="h-3 skeleton rounded w-32" />
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-x-8 gap-y-4">
        <div className="hidden md:block"><FiltersSkeleton /></div>
        <ProductGridSkeleton count={12} />
      </div>
    </>
  );
}

async function Results({
  parsed,
  categories,
  activeCategoryId,
}: {
  parsed: ApiSearchParams;
  categories: Category[];
  activeCategoryId: number;
}) {
  const data = await searchProducts(parsed);
  return (
    <>
      <div className="text-xs text-muted uppercase tracking-wider">
        {data.total.toLocaleString('fi-FI')} tulosta
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-x-8 gap-y-4">
        <Filters filters={data.available_filters} allCategories={categories} activeCategoryId={activeCategoryId} />

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
    </>
  );
}
