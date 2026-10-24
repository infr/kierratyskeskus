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

export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
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

// Legacy route. New canonical is /<root-cat>/<product-slug>/p/<id>.
// We redirect there when we can resolve the category; otherwise we render
// in place so existing links never 404.
export default async function LegacyProductPage(props: Props) {
  const params = await props.params;
  const [product, categories] = await Promise.all([
    getProduct(params.id).catch(() => null),
    getCategories().catch(() => [] as Category[]),
  ]);
  if (!product) notFound();

  const canonical = productHref(product, categories);
  if (canonical !== `/p/${params.id}`) {
    redirect(canonical);
  }

  return <ProductPageView product={product} categories={categories} />;
}
