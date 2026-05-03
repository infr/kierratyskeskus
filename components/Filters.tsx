'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { AnyFilter, Category } from '@/lib/api';
import { categoryHref } from '@/lib/categories';

function setListParam(p: URLSearchParams, key: string, vals: string[]) {
  if (vals.length) p.set(key, vals.join(',')); else p.delete(key);
}

// API sometimes returns multiple filters with the same display name (e.g.
// both `categories` and `cross_categories` are labeled "Kategoriat"). When
// two share a name we keep the one with more options, since the richer set
// is more useful as the single visible facet.
function dedupeByName(filters: AnyFilter[]): AnyFilter[] {
  const optionCount = (f: AnyFilter) => (f.type === 'TERM' ? f.options.length : 0);
  const winners = new Map<string, AnyFilter>();
  for (const f of filters) {
    const cur = winners.get(f.name);
    if (!cur || optionCount(f) > optionCount(cur)) winners.set(f.name, f);
  }
  return filters.filter((f) => winners.get(f.name) === f);
}

export function Filters({
  filters,
  allCategories,
  activeCategoryId,
}: {
  filters: AnyFilter[];
  allCategories?: Category[];
  activeCategoryId?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const visible = dedupeByName(filters);

  const activeCount = (() => {
    let n = 0;
    for (const [k, v] of sp.entries()) {
      if (k === 'q' || k === 'page' || k === 'categories') continue;
      if (v) n += k === 'priceMin' || k === 'priceMax' ? 1 : v.split(',').length;
    }
    return n;
  })();

  function update(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    next.delete('page');
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function toggleTerm(filterKey: string, value: string) {
    const cur = (sp.get(filterKey) ?? '').split(',').filter(Boolean);
    const idx = cur.indexOf(value);
    if (idx >= 0) cur.splice(idx, 1); else cur.push(value);
    update((p) => setListParam(p, filterKey, cur));
  }

  function clearAll() {
    update((p) => {
      const q = p.get('q');
      Array.from(p.keys()).forEach((k) => p.delete(k));
      if (q) p.set('q', q);
    });
  }

  const otherTerms = visible.filter(
    (f) =>
      f.type === 'TERM' &&
      (f as any).options?.length &&
      f.key !== 'categories' &&
      f.key !== 'cross_categories',
  );

  const categoriesFilter = visible.find(
    (f) => f.type === 'TERM' && (f.key === 'categories' || f.key === 'cross_categories'),
  ) as
    | { key: string; name: string; options: { value: string; name: string; count: number }[] }
    | undefined;

  const hasFilters =
    !!visible.find((f) => f.key === 'price') || otherTerms.length > 0;

  const showCategoryList = !!(categoriesFilter && allCategories && allCategories.length > 0);

  if (!hasFilters && !showCategoryList) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden w-full mb-3 rounded-md bg-white px-4 py-3 text-sm font-medium flex items-center justify-between"
        aria-expanded={open}
      >
        <span>Suodattimet{activeCount ? ` · ${activeCount}` : ''}</span>
        <span className="text-muted">{open ? '−' : '+'}</span>
      </button>

      <aside className={`${open ? 'block' : 'hidden'} md:block space-y-3`}>
        {showCategoryList && (
          <div className="bg-white rounded-md ring-1 ring-black/5 p-4">
            <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Kategoriat</h2>
            <CategoryList
              filter={categoriesFilter!}
              allCategories={allCategories!}
              activeCategoryId={activeCategoryId}
            />
          </div>
        )}

        {hasFilters && (
          <div className="bg-white rounded-md ring-1 ring-black/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider text-muted">Suodattimet</h2>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-ink/70 hover:text-ink underline-offset-2 hover:underline">
                  Tyhjennä ({activeCount})
                </button>
              )}
            </div>

            <div className="space-y-5">
              <PriceFilter filter={visible.find((f) => f.key === 'price') as any} update={update} />

              {otherTerms.map((f: any) => (
                <TermBlock
                  key={f.key}
                  filter={f}
                  selected={(sp.get(f.key) ?? '').split(',').filter(Boolean)}
                  onToggle={(v) => toggleTerm(f.key, v)}
                />
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function CategoryList({
  filter,
  allCategories,
  activeCategoryId,
}: {
  filter: { options: { value: string; name: string; count: number }[] };
  allCategories: Category[];
  activeCategoryId?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const catById = new Map(allCategories.map((c) => [c.id, c]));

  // Highest counts first; the filter is a navigation aid in this context,
  // so the most populated categories are the most useful entry points.
  const sorted = filter.options
    .map((o) => ({ option: o, cat: catById.get(Number(o.value)) }))
    .filter((x): x is { option: typeof x.option; cat: Category } => !!x.cat)
    .sort((a, b) => b.option.count - a.option.count);

  const limit = 10;
  const visible = showAll ? sorted : sorted.slice(0, limit);

  return (
    <ul className="space-y-0.5">
      {visible.map(({ option, cat }) => {
        const active = activeCategoryId === cat.id;
        return (
          <li key={cat.id}>
            <a
              href={categoryHref(cat.slug)}
              className={`flex items-center gap-2 text-sm py-1 ${active ? 'font-medium text-ink' : 'text-ink/90 hover:text-ink'}`}
            >
              <span className="flex-1">{cat.name}</span>
              <span className="text-muted text-xs">{option.count}</span>
            </a>
          </li>
        );
      })}
      {sorted.length > limit && (
        <li>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-ink/80 hover:text-ink underline-offset-2 hover:underline mt-1"
          >
            {showAll ? 'Näytä vähemmän' : `Näytä kaikki (${sorted.length})`}
          </button>
        </li>
      )}
    </ul>
  );
}

function TermBlock({
  filter,
  selected,
  onToggle,
}: {
  filter: { key: string; name: string; options: { value: string; name: string; count: number }[] };
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const opts = showAll ? filter.options : filter.options.slice(0, 8);
  // When this facet has an active selection the API switches to global
  // (catalog-wide) counts for every option in this facet, so the numbers
  // would no longer reflect the current search. Hide them in that case.
  const hideCounts = selected.length > 0;
  return (
    <details open className="group">
      <summary className="cursor-pointer font-medium text-sm py-1.5 list-none flex justify-between items-center">
        <span>{filter.name}</span>
        <span className="text-muted text-xs transition group-open:rotate-180">▾</span>
      </summary>
      <ul className="mt-1 space-y-0.5">
        {opts.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className="flex items-center gap-2 text-sm py-1 cursor-pointer text-ink hover:text-ink">
                <input type="checkbox" checked={on} onChange={() => onToggle(o.value)} className="accent-ink w-4 h-4" />
                <span className="flex-1">{o.name}</span>
                {!hideCounts && <span className="text-muted text-xs">{o.count}</span>}
              </label>
            </li>
          );
        })}
        {filter.options.length > 8 && (
          <li>
            <button onClick={() => setShowAll((v) => !v)} className="text-xs text-ink/80 hover:text-ink underline-offset-2 hover:underline mt-1">
              {showAll ? 'Näytä vähemmän' : `Näytä kaikki (${filter.options.length})`}
            </button>
          </li>
        )}
      </ul>
    </details>
  );
}

function PriceFilter({
  filter,
  update,
}: {
  filter?: { min: number; max: number; unit?: string };
  update: (m: (p: URLSearchParams) => void) => void;
}) {
  const sp = useSearchParams();
  const [min, setMin] = useState(sp.get('priceMin') ?? '');
  const [max, setMax] = useState(sp.get('priceMax') ?? '');
  if (!filter) return null;

  function apply() {
    update((p) => {
      if (min) p.set('priceMin', min); else p.delete('priceMin');
      if (max) p.set('priceMax', max); else p.delete('priceMax');
    });
  }

  return (
    <div>
      <div className="font-medium text-sm mb-2">Hinta ({filter.unit ?? '€'})</div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          inputMode="decimal"
          min={filter.min}
          max={filter.max}
          placeholder={String(filter.min)}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-20 rounded bg-white px-2 py-1.5 text-sm border-0"
        />
        <span className="text-muted">–</span>
        <input
          type="number"
          inputMode="decimal"
          min={filter.min}
          max={filter.max}
          placeholder={String(filter.max)}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-20 rounded bg-white px-2 py-1.5 text-sm border-0"
        />
        <button
          onClick={apply}
          className="ml-auto text-xs rounded bg-ink text-paper px-3 py-1.5 hover:bg-black"
        >
          OK
        </button>
      </div>
    </div>
  );
}

