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
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { BackToSearch } from '@/components/BackToSearch';
import { SimilarItems, SimilarItemsSkeleton } from '@/components/SimilarItems';

type Props = { params: { id: string } };

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
    ...path.map((c) => ({ label: c.name, href: `/?categories=${c.id}` })),
    { label: product.name },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <BackToSearch />
      </div>
      <Breadcrumbs items={crumbs} />

      <article className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-md overflow-hidden">
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

          <p className="text-xs text-muted pt-6">
            Epävirallinen mobiilinäkymä. "Osta" vie alkuperäiselle sivulle.
          </p>
        </div>

        <Suspense fallback={<SimilarItemsSkeleton />}>
          <SimilarItems categoryId={product.main_category_id} excludeId={product.id} />
        </Suspense>
      </article>
    </div>
  );
}
