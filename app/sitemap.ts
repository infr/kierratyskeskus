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

  for (const c of categories) {
    entries.push({
      url: absoluteUrl(`/?categories=${c.id}`),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
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
