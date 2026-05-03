'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { AnyFilter } from '@/lib/api';

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

export function Filters({ filters }: { filters: AnyFilter[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const visible = dedupeByName(filters);

  const activeCount = (() => {
    let n = 0;
    for (const [k, v] of sp.entries()) {
      if (k === 'q' || k === 'page') continue;
      if (v) n += k === 'priceMin' || k === 'priceMax' ? 1 : v.split(',').length;
    }
    return n;
  })();

  function update(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    next.delete('page');
    // Wrap in startTransition so React keeps the current results visible
    // while data refetches, instead of swapping the page Suspense boundary
    // to its skeleton fallback (which feels like a full reload).
    startTransition(() => {
      router.push(`/?${next.toString()}`);
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

      <aside className={`${open ? 'block' : 'hidden'} md:block bg-white rounded-md ring-1 ring-black/5 p-4`}>
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
          <BoolFilter filter={visible.find((f) => f.key === 'inStock') as any} update={update} />

          {visible
            .filter((f) => f.type === 'TERM' && (f as any).options?.length)
            .map((f: any) => (
              <TermBlock
                key={f.key}
                filter={f}
                selected={(sp.get(f.key) ?? '').split(',').filter(Boolean)}
                onToggle={(v) => toggleTerm(f.key, v)}
              />
            ))}
        </div>
      </aside>
    </>
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
                <span className="text-muted text-xs">{o.count}</span>
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

function BoolFilter({
  filter,
  update,
}: {
  filter?: { key: string; name: string };
  update: (m: (p: URLSearchParams) => void) => void;
}) {
  const sp = useSearchParams();
  if (!filter) return null;
  const on = sp.get(filter.key) === '1';
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={on}
        onChange={() => update((p) => (on ? p.delete(filter.key) : p.set(filter.key, '1')))}
        className="accent-ink w-4 h-4"
      />
      <span>{filter.name}</span>
    </label>
  );
}
