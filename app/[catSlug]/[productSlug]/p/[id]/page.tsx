import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import {
  formatPrice,
  getCategories,
  getProduct,
  productImage,
  type Category,
} from '@/lib/api';
import { productHref } from '@/lib/categories';
import { htmlToText } from '@/lib/text';
import { absoluteUrl, SITE_NAME, truncate } from '@/lib/site';
import { ProductPageView } from '@/components/ProductPageView';

type Props = {
  params: { catSlug: string; productSlug: string; id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id).catch(() => null);
  if (!product) {
    return { title: 'Tuotetta ei löytynyt', robots: { index: false, follow: false } };
  }
  const categories = await getCategories().catch(() => [] as Category[]);
  const img = productImage(product, 'large') ?? productImage(product, 'medium');
  const desc = truncate(
    htmlToText(product.description_long) || product.description_short || product.name,
    160,
  );
  const url = absoluteUrl(productHref(product, categories));
  const price = formatPrice(product.price_info);
  return {
    title: product.name,
    description: desc || `${product.name} ${price ? `· ${price}` : ''} · ${SITE_NAME}`.trim(),
    openGraph: {
      type: 'website',
      url,
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
    getCategories().catch(() => [] as Category[]),
  ]);
  if (!product) notFound();

  // If the URL slugs don't match the canonical, send the user to the
  // canonical URL (e.g. typo / outdated link) — keeps SEO clean.
  const canonical = productHref(product, categories);
  const requested = `/${params.catSlug}/${params.productSlug}/p/${params.id}`;
  if (canonical !== requested && canonical !== `/p/${params.id}`) {
    redirect(canonical);
  }

  return <ProductPageView product={product} categories={categories} />;
}
