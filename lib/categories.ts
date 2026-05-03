import type { Category } from './api';

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
