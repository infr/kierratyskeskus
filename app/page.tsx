import type { Metadata } from 'next';
import {
  searchProducts,
  getCategories,
  getBreadcrumbPath,
  type SearchParams as ApiSearchParams,
} from '@/lib/api';
import { parseSearchParams } from '@/lib/searchParams';
import { absoluteUrl, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import { SearchBox } from '@/components/SearchBox';
import { Filters } from '@/components/Filters';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { RecentSearches } from '@/components/RecentSearches';
import { JsonLd } from '@/components/JsonLd';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const parsed = parseSearchParams(searchParams);
  const cats = parsed.filters?.categories;
  const firstCat = Array.isArray(cats) ? cats[0] : cats;

  let categoryName: string | null = null;
  if (firstCat) {
    const all = await getCategories().catch(() => []);
    const path = getBreadcrumbPath(all, Number(firstCat));
    categoryName = path[path.length - 1]?.name ?? null;
  }

  const parts: string[] = [];
  if (parsed.text) parts.push(`Haku: "${parsed.text}"`);
  if (categoryName) parts.push(categoryName);
  if (parsed.page && parsed.page > 1) parts.push(`sivu ${parsed.page}`);

  const titleHead = parts.length ? parts.join(' · ') : 'Kaikki tuotteet ja suodattimet mobiilissa';
  const description = parsed.text
    ? `Hakutulokset hakusanalle "${parsed.text}" Kierrätyskeskuksen kaupasta. Suodata kategoriaa, hintaa ja kuntoa myös mobiilissa.`
    : categoryName
    ? `${categoryName} Kierrätyskeskuksen kaupasta. Selaa, suodata ja löydä käytetyt tavarat helposti mobiilissa.`
    : SITE_TAGLINE;

  const u = new URLSearchParams();
  if (parsed.text) u.set('q', parsed.text);
  if (firstCat) u.set('categories', String(firstCat));
  if (parsed.page && parsed.page > 1) u.set('page', String(parsed.page));
  const canonical = u.toString() ? `${SITE_URL}/?${u.toString()}` : `${SITE_URL}/`;
  const noindex = (parsed.page ?? 1) > 1;
  const fullTitle = `${titleHead} | ${SITE_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      type: 'website',
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      locale: 'fi_FI',
    },
    twitter: { card: 'summary', title: fullTitle, description },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    other: {
      'og:url': canonical,
    },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const parsed: ApiSearchParams = parseSearchParams(searchParams);

  const [data, categories] = await Promise.all([
    searchProducts(parsed),
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
  ]);

  const u = new URLSearchParams();
  if (parsed.text) u.set('q', parsed.text);
  const cf = parsed.filters?.categories;
  const firstCat = Array.isArray(cf) ? cf[0] : cf;
  if (firstCat) u.set('categories', String(firstCat));
  if (parsed.page && parsed.page > 1) u.set('page', String(parsed.page));
  const canonical = u.toString() ? `${SITE_URL}/?${u.toString()}` : `${SITE_URL}/`;

  const categoryFilter = parsed.filters?.categories;
  const firstCategoryId = Array.isArray(categoryFilter) ? categoryFilter[0] : categoryFilter;
  const categoryPath = firstCategoryId
    ? getBreadcrumbPath(categories, Number(firstCategoryId))
    : [];

  const crumbs: Crumb[] = [{ label: 'Etusivu', href: '/' }];
  for (const c of categoryPath) crumbs.push({ label: c.name, href: `/?categories=${c.id}` });
  if (parsed.text) crumbs.push({ label: `Haku: "${parsed.text}"` });

  const heading = parsed.text
    ? `Hakutulokset: "${parsed.text}"`
    : categoryPath.length
    ? categoryPath[categoryPath.length - 1].name
    : 'Selaa Kierrätyskeskuksen tuotteita';

  const breadcrumbJsonLd =
    crumbs.length > 1
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            item: c.href ? absoluteUrl(c.href) : absoluteUrl('/'),
          })),
        }
      : null;

  return (
    <div className="space-y-5">
      <link rel="canonical" href={canonical} />
      {crumbs.length > 1 && <Breadcrumbs items={crumbs} />}

      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>

      <SearchBox />

      <RecentSearches />

      <div className="text-xs text-muted uppercase tracking-wider">
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

      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
    </div>
  );
}
