import type { MetadataRoute } from 'next';
import { getCategories, searchProducts } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
  ];

  const [categories, recent] = await Promise.all([
    getCategories().catch(() => []),
    searchProducts({ perPage: 200 }).catch(() => null),
  ]);

  // Emit one URL per unique slug. Roots take priority over duplicate child slugs.
  const seen = new Set<string>();
  const sorted = [...categories].sort((a, b) =>
    a.parent_id == null ? -1 : b.parent_id == null ? 1 : 0,
  );
  for (const c of sorted) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    entries.push({
      url: absoluteUrl(`/${c.slug}`),
      lastModified: now,
      changeFrequency: 'daily',
      priority: c.parent_id == null ? 0.7 : 0.6,
    });
  }

  if (recent?.data?.length) {
    for (const p of recent.data) {
      entries.push({
        url: absoluteUrl(`/p/${p.id}`),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
