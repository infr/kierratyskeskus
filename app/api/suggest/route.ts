import { NextRequest, NextResponse } from 'next/server';
import {
  searchProducts,
  getCategories,
  productImage,
  formatPrice,
  type Category,
} from '@/lib/api';

export const runtime = 'nodejs';

function rankCategoryMatches(categories: Category[], q: string, limit = 5) {
  const needle = q.toLowerCase();
  type Match = Category & { _rank: number };
  const matches: Match[] = [];
  for (const c of categories) {
    const name = c.name.toLowerCase();
    if (name === needle) matches.push({ ...c, _rank: 0 });
    else if (name.startsWith(needle)) matches.push({ ...c, _rank: 1 });
    else if (name.includes(needle)) matches.push({ ...c, _rank: 2 });
  }
  matches.sort((a, b) => a._rank - b._rank || a.name.length - b.name.length);
  return matches.slice(0, limit).map(({ _rank, ...rest }) => rest);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ query: q, categories: [], products: [] });

  try {
    const [data, allCategories] = await Promise.all([
      searchProducts({ text: q, perPage: 6 }),
      getCategories().catch(() => [] as Category[]),
    ]);

    const categories = rankCategoryMatches(allCategories, q, 5).map((c) => ({
      id: c.id,
      name: c.name,
    }));

    const products = data.data.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      price: formatPrice(p.price_info),
      image: productImage(p, 'small') ?? null,
    }));

    return NextResponse.json({ query: q, total: data.total, categories, products });
  } catch (e) {
    return NextResponse.json(
      { query: q, categories: [], products: [], error: 'upstream' },
      { status: 502 },
    );
  }
}
