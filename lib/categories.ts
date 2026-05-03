import type { Category, Product } from './api';

// One slug ('lasten-vaatteet') is reused by both a root category and a
// child of itself. Prefer the root so the URL points at the broader page.
export function findCategoryBySlug(
  categories: Category[],
  slug: string,
): Category | null {
  const matches = categories.filter((c) => c.slug === slug);
  if (matches.length === 0) return null;
  return matches.find((c) => c.parent_id == null) ?? matches[0];
}

export function getChildren(categories: Category[], parentId: number): Category[] {
  return categories.filter((c) => c.parent_id === parentId);
}

export function getRoots(categories: Category[]): Category[] {
  return categories.filter((c) => c.parent_id == null);
}

export function categoryHref(slug: string): string {
  return `/${slug}`;
}

// Walk parent_id up to the root.
export function getRootCategory(categories: Category[], leafId?: number | null): Category | null {
  if (!leafId) return null;
  const byId = new Map(categories.map((c) => [c.id, c]));
  let cur = byId.get(leafId);
  const seen = new Set<number>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.parent_id == null) return cur;
    cur = byId.get(cur.parent_id);
  }
  return null;
}

// SEO-friendly product URL: /<root-category-slug>/<product-slug>/p/<id>
// Mirrors the upstream URL format. Falls back to /p/<id> if we can't
// resolve the root category or product slug.
export function productHref(product: Pick<Product, 'id' | 'slug' | 'main_category_id'>, categories: Category[]): string {
  const id = product.id;
  if (!product.slug) return `/p/${id}`;
  const root = getRootCategory(categories, product.main_category_id);
  if (!root) return `/p/${id}`;
  return `/${root.slug}/${product.slug}/p/${id}`;
}
