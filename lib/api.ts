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

export function buildSearchQuery(p: SearchParams): string {
  const params = new URLSearchParams();
  if (p.text) params.set('text', p.text);
  if (p.page && p.page > 1) params.set('page', String(p.page));
  params.set('per_page', String(p.perPage ?? 36));
  if (p.inStock) params.set('inStock', '1');
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

export async function searchProducts(p: SearchParams): Promise<SearchResponse> {
  const qs = buildSearchQuery(p);
  const url = `${API_BASE}/products?${qs}`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
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
