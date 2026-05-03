import type { SearchParams } from './api';

const KNOWN_TOP = new Set(['q', 'page', 'inStock', 'priceMin', 'priceMax']);

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchParams {
  const filters: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (KNOWN_TOP.has(k)) continue;
    if (v == null) continue;
    filters[k] = Array.isArray(v) ? v : v.split(',').filter(Boolean);
  }
  const out: SearchParams = {
    text: typeof sp.q === 'string' ? sp.q : undefined,
    page: sp.page ? Number(sp.page) || 1 : 1,
    inStock: sp.inStock === '1' || sp.inStock === 'true',
    priceMin: sp.priceMin ? Number(sp.priceMin) : undefined,
    priceMax: sp.priceMax ? Number(sp.priceMax) : undefined,
    filters,
  };
  return out;
}

export function toQueryString(sp: SearchParams): string {
  const u = new URLSearchParams();
  if (sp.text) u.set('q', sp.text);
  if (sp.page && sp.page > 1) u.set('page', String(sp.page));
  if (sp.inStock) u.set('inStock', '1');
  if (sp.priceMin != null) u.set('priceMin', String(sp.priceMin));
  if (sp.priceMax != null) u.set('priceMax', String(sp.priceMax));
  if (sp.filters) {
    for (const [key, vals] of Object.entries(sp.filters)) {
      const arr = Array.isArray(vals) ? vals : [vals];
      if (arr.length) u.set(key, arr.join(','));
    }
  }
  return u.toString();
}

export function toggleFilterValue(sp: SearchParams, key: string, value: string): SearchParams {
  const cur = sp.filters?.[key];
  const arr = Array.isArray(cur) ? [...cur] : cur ? [cur] : [];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
  const filters = { ...(sp.filters || {}) };
  if (arr.length) filters[key] = arr; else delete filters[key];
  return { ...sp, filters, page: 1 };
}
