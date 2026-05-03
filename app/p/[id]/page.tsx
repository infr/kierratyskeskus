import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  deepLink,
  formatPrice,
  getCategories,
  getBreadcrumbPath,
  getProduct,
  productImage,
} from '@/lib/api';
import { htmlToText } from '@/lib/text';
import { absoluteUrl, SITE_NAME, SITE_URL, truncate } from '@/lib/site';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { BackToSearch } from '@/components/BackToSearch';
import { JsonLd } from '@/components/JsonLd';
import { SimilarItems, SimilarItemsSkeleton } from '@/components/SimilarItems';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id).catch(() => null);
  if (!product) {
    return {
      title: 'Tuotetta ei löytynyt',
      robots: { index: false, follow: false },
    };
  }
  const img = productImage(product, 'large') ?? productImage(product, 'medium');
  const desc = truncate(
    htmlToText(product.description_long) || product.description_short || product.name,
    160,
  );
  const path = `/p/${product.id}`;
  const price = formatPrice(product.price_info);
  return {
    title: product.name,
    description: desc || `${product.name} ${price ? `· ${price}` : ''} · ${SITE_NAME}`.trim(),
    openGraph: {
      type: 'website',
      url: absoluteUrl(path),
      title: `${product.name}${price ? ` · ${price}` : ''}`,
      description: desc,
      images: img ? [{ url: img }] : undefined,
      locale: 'fi_FI',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name}${price ? ` · ${price}` : ''}`,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const [product, categories] = await Promise.all([
    getProduct(params.id).catch(() => null),
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
  ]);
  if (!product) notFound();

  const img = productImage(product, 'large') ?? productImage(product, 'medium');
  const buyUrl = deepLink(product);
  const longText = htmlToText(product.description_long);
  const path = getBreadcrumbPath(categories, product.main_category_id);

  const crumbs: Crumb[] = [
    { label: 'Etusivu', href: '/' },
    ...path.map((c) => ({ label: c.name, href: `/${c.slug}` })),
    { label: product.name },
  ];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncate(longText || product.description_short || product.name, 5000),
    image: img ? [img] : undefined,
    sku: String(product.id),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/p/${product.id}`),
      priceCurrency: 'EUR',
      price: product.price_info?.price?.with_tax ?? undefined,
      availability: product.sold_out
        ? 'https://schema.org/SoldOut'
        : product.available_online
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.href ? absoluteUrl(c.href) : absoluteUrl(`/p/${product.id}`),
    })),
  };

  return (
    <div className="space-y-4">
      <link rel="canonical" href={absoluteUrl(`/p/${product.id}`)} />
      <div className="flex items-center justify-between gap-4">
        <BackToSearch />
      </div>
      <Breadcrumbs items={crumbs} />

      <article className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-md ring-1 ring-black/5 overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name} className="w-full h-auto object-contain" />
          ) : (
            <div className="aspect-square flex items-center justify-center text-muted">ei kuvaa</div>
          )}
        </div>

        <div className="space-y-5">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">{product.name}</h1>

          <div className="text-3xl font-bold">{formatPrice(product.price_info)}</div>

          {product.sold_out ? (
            <div className="text-sm text-muted">Tuote on myyty.</div>
          ) : product.available_online ? (
            <div className="text-sm flex items-center gap-2 text-muted">
              <span className="inline-block w-2 h-2 rounded-full bg-accent" />
              Saatavilla verkossa
            </div>
          ) : null}

          <a
            href={buyUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-center w-full rounded-md bg-ink text-paper py-3 font-medium hover:bg-black"
          >
            Osta Kierrätyskeskuksen sivulla →
          </a>

          {product.description_short && <p className="text-sm text-ink">{product.description_short}</p>}

          {longText && (
            <div className="text-sm text-ink/90 whitespace-pre-line pt-4">
              {longText}
            </div>
          )}
        </div>

        <Suspense fallback={<SimilarItemsSkeleton />}>
          <SimilarItems categoryId={product.main_category_id} excludeId={product.id} />
        </Suspense>
      </article>

      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
    </div>
  );
}
