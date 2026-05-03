export const API_ORIGIN = 'https://kauppa.kierratyskeskus.fi';
export const API_BASE = `${API_ORIGIN}/backend/api/v1`;

export type ImageSizes = { small?: string; medium?: string; large?: string; original?: string };
export type ProductImage = { id: number; product_id: string; sizes: ImageSizes };
export type Price = { with_tax: number; without_tax: number };
export type PriceInfo = { price: Price; normal_price?: Price; lowest_price_30d?: Price };

export type Product = {
  id: number | string;
  name: string;
  slug: string;
  main_category_id?: number;
  images?: ProductImage[];
  price_info?: PriceInfo;
  description_short?: string;
  description_long?: string;
  available_online?: boolean;
  available_in_store?: boolean;
  sold_out?: boolean;
  stock_unit?: string;
  free_quantity?: number;
};

export type FilterOption = { value: string; count: number; name: string };
export type TermFilter = { type: 'TERM' | 'SINGLETERM'; key: string; name: string; options: FilterOption[] };
export type RangeFilter = { type: 'RANGE'; key: string; name: string; min: number; max: number; step?: number; unit?: string };
export type BoolFilter = { type: 'BOOLEAN'; key: string; name: string };
export type AnyFilter = TermFilter | RangeFilter | BoolFilter;

export type SearchResponse = {
  current_page: number;
  data: Product[];
  last_page: number;
  per_page: number;
  total: number;
  available_filters: AnyFilter[];
};

export type SearchParams = {
  text?: string;
  page?: number;
  perPage?: number;
  filters?: Record<string, string[] | string>;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
};

const FETCH_OPTS: RequestInit = {
  headers: { Accept: 'application/json', 'User-Agent': 'kierratyskeskus-mobile-frontend/0.1' },
  next: { revalidate: 60 },
} as RequestInit;

// The upstream search backend uses Lucene-style query parsing. Special
// characters like `&`, `|`, `:`, `(`, `)` are operators — leaving them in
// the query yields garbage (e.g. `bang & olufsen` matches anything with
// `&` in the name). Strip operators but otherwise leave the query as a
// loose token match, matching the upstream frontend's behavior.
export function normalizeSearchText(input: string): string {
  return input
    .replace(/[&|()[\]{}:"*?^~+\\!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchQuery(p: SearchParams): string {
  const params = new URLSearchParams();
  if (p.text) {
    const normalized = normalizeSearchText(p.text);
    if (normalized) {
      params.set('text', normalized);
      // Without explicit orderBy=RELEVANCE the API returns results in some
      // internal order (id? popularity?) that buries exact-name matches.
      // The upstream frontend always sends these for text queries, which is
      // what makes "bang & olufsen" surface the actual B&O products first.
      params.set('orderBy', 'RELEVANCE');
      params.set('order', 'DESC');
    }
  }
  if (p.page && p.page > 1) params.set('page', String(p.page));
  params.set('per_page', String(p.perPage ?? 36));
  // Always limit to in-stock items unless the caller explicitly disables it.
  // Without this the API silently returns sold-out items in `total` and
  // facet counts but not in the page data, breaking pagination and making
  // facet counts wildly wrong (e.g. "Täysin uusi 51" when only 7 are
  // actually visible after clicking). Upstream's frontend does this too.
  if (p.inStock !== false) params.set('inStock', '1');
  if (p.priceMin != null) params.set('price[min]', String(p.priceMin));
  if (p.priceMax != null) params.set('price[max]', String(p.priceMax));
  if (p.filters) {
    for (const [key, val] of Object.entries(p.filters)) {
      const arr = Array.isArray(val) ? val : [val];
      for (const v of arr) params.append(`${key}[]`, v);
    }
  }
  return params.toString();
}

// With inStock=1 (always set above) upstream's pagination is usually clean
// — 50 items per page consistently. But if a caller disables inStock or for
// queries where the upstream still returns sparse pages (post-filter
// dropouts), we aggregate multiple upstream pages and re-paginate so the
// user gets a consistent perPage worth of items each page. First page is
// always fetched; remaining pages are batched in parallel. Capped to bound
// latency.
const UPSTREAM_PAGE_CAP = 24;
const UPSTREAM_BATCH_SIZE = 4;

async function fetchUpstreamPage(p: SearchParams): Promise<SearchResponse> {
  const qs = buildSearchQuery(p);
  const url = `${API_BASE}/products?${qs}`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
}

export async function searchProducts(p: SearchParams): Promise<SearchResponse> {
  const desired = p.perPage ?? 36;
  const userPage = p.page && p.page > 0 ? p.page : 1;
  const startSkip = (userPage - 1) * desired;
  const need = startSkip + desired + 1; // +1 lets us tell whether there's a next page

  // First page is always required and gives us upstream's last_page bound.
  const first = await fetchUpstreamPage({ ...p, page: 1, perPage: undefined });
  const collected: Product[] = [...first.data];
  let last: SearchResponse = first;

  const upstreamLast = Math.min(first.last_page ?? 1, UPSTREAM_PAGE_CAP);

  // Fetch the remaining pages in parallel batches, exiting early once we
  // have enough items to render the current user page (and detect a next).
  let nextPage = 2;
  while (collected.length < need && nextPage <= upstreamLast) {
    const batch: number[] = [];
    for (let i = 0; i < UPSTREAM_BATCH_SIZE && nextPage + i <= upstreamLast; i++) {
      batch.push(nextPage + i);
    }
    const responses = await Promise.all(
      batch.map((page) => fetchUpstreamPage({ ...p, page, perPage: undefined })),
    );
    for (const r of responses) {
      collected.push(...r.data);
      last = r;
    }
    nextPage += batch.length;
  }

  const sliced = collected.slice(startSkip, startSkip + desired);
  const hasMore = collected.length > startSkip + desired;
  // Upstream's `total` is approximate (facet-influenced) but stable across
  // page navigations. Using collected.length would make the displayed total
  // grow as the user pages forward, which is more confusing than a
  // slightly-off stable number.
  const last_page = hasMore ? userPage + 1 : Math.max(userPage, 1);

  return {
    ...last,
    current_page: userPage,
    data: sliced,
    per_page: desired,
    last_page,
  };
}

export async function getProduct(id: string | number): Promise<Product> {
  const url = `${API_BASE}/products/${id}`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
}

export function productImage(p: Product, size: keyof ImageSizes = 'medium'): string | undefined {
  const img = p.images?.[0]?.sizes;
  return img?.[size] ?? img?.original ?? img?.large ?? img?.medium ?? img?.small;
}

export function deepLink(p: Pick<Product, 'id' | 'slug'>): string {
  const slug = p.slug || 'item';
  return `${API_ORIGIN}/${slug}/p/${p.id}/`;
}

export function formatPrice(p?: PriceInfo): string {
  const v = p?.price?.with_tax;
  if (v == null) return '';
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(v);
}

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

export async function getCategories(): Promise<Category[]> {
  const url = `${API_BASE}/categories`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
}

export function getBreadcrumbPath(categories: Category[], leafId?: number | null): Category[] {
  if (!leafId) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set<number>();
  const path: Category[] = [];
  let cur = byId.get(leafId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    if (cur.parent_id == null) break;
    cur = byId.get(cur.parent_id);
  }
  return path;
}
