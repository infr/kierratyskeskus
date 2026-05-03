import Link from 'next/link';
import { formatPrice, productImage, type Product } from '@/lib/api';

export function ProductCard({ p }: { p: Product }) {
  const img = productImage(p, 'medium') ?? productImage(p, 'small');
  const price = formatPrice(p.price_info);

  return (
    <Link
      href={`/p/${p.id}`}
      className="block group bg-white rounded-md ring-1 ring-black/5 overflow-hidden hover:ring-black/15 transition"
    >
      <div className="aspect-square overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">ei kuvaa</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm line-clamp-2 leading-snug min-h-[2.5em] text-ink">{p.name}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-ink">{price}</span>
          {p.sold_out && <span className="text-xs text-muted">myyty</span>}
        </div>
      </div>
    </Link>
  );
}
