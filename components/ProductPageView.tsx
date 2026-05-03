import { Suspense } from 'react';
import {
  deepLink,
  formatPrice,
  getBreadcrumbPath,
  productImage,
  type Category,
  type Product,
} from '@/lib/api';
import { productHref } from '@/lib/categories';
import { htmlToText } from '@/lib/text';
import { absoluteUrl, truncate } from '@/lib/site';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { BackToSearch } from '@/components/BackToSearch';
import { JsonLd } from '@/components/JsonLd';
import { ProductGallery } from '@/components/ProductGallery';
import { SimilarItems, SimilarItemsSkeleton } from '@/components/SimilarItems';

export function ProductPageView({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const img = productImage(product, 'large') ?? productImage(product, 'medium');
  const buyUrl = deepLink(product);
  const longText = htmlToText(product.description_long);
  const path = getBreadcrumbPath(categories, product.main_category_id);
  const canonical = absoluteUrl(productHref(product, categories));

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
      url: canonical,
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
      item: c.href ? absoluteUrl(c.href) : canonical,
    })),
  };

  return (
    <div className="space-y-4">
      <link rel="canonical" href={canonical} />
      <div className="flex items-center justify-between gap-4">
        <BackToSearch />
      </div>
      <Breadcrumbs items={crumbs} />

      <article className="grid md:grid-cols-2 gap-8">
        <ProductGallery images={product.images ?? []} alt={product.name} />

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

          {product.extra_properties && product.extra_properties.length > 0 && (
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {product.extra_properties.map((p) => (
                <div key={p.id} className="contents">
                  <dt className="text-muted">{p.name}</dt>
                  <dd className="text-ink">{p.value_name}</dd>
                </div>
              ))}
            </dl>
          )}

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
          <SimilarItems
            categoryId={product.main_category_id}
            excludeId={product.id}
            categories={categories}
          />
        </Suspense>
      </article>

      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
    </div>
  );
}
