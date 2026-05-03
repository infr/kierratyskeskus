import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, productImage, formatPrice } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ query: q, products: [] });

  try {
    const data = await searchProducts({ text: q, perPage: 6 });
    const products = data.data.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      price: formatPrice(p.price_info),
      image: productImage(p, 'small') ?? null,
    }));
    return NextResponse.json({ query: q, total: data.total, products });
  } catch (e) {
    return NextResponse.json({ query: q, products: [], error: 'upstream' }, { status: 502 });
  }
}
