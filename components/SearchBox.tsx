'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  pushHistory,
  readHistory,
  removeHistory,
  clearHistory,
  onHistoryChange,
  countActiveFilters,
  summarizeFilters,
  type HistoryEntry,
} from '@/lib/history';
import { rememberSearch } from '@/components/BackToSearch';
import { HotlinkImage } from '@/components/HotlinkImage';

type ProductHit = { id: string | number; name: string; price: string; image: string | null; href?: string };
type CategoryHit = { id: number; name: string; slug?: string };
type Resp = { query: string; categories: CategoryHit[]; products: ProductHit[]; total?: number };

type Item =
  | { kind: 'history'; value: HistoryEntry; index: number }
  | { kind: 'category'; value: CategoryHit; index: number }
  | { kind: 'product'; value: ProductHit; index: number }
  | { kind: 'showAll'; value: string; index: number };

export function SearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [categories, setCategories] = useState<CategoryHit[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setVal(sp.get('q') ?? ''); }, [sp]);
  useEffect(() => {
    setHistory(readHistory());
    return onHistoryChange(() => setHistory(readHistory()));
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      rememberSearch(window.location.pathname + window.location.search);
    }
  }, [sp]);

  // Auto-save the current search state to history (debounced) so refining
  // filters after a search updates the saved entry instead of leaving it stale.
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    const q = params.get('q')?.trim() ?? '';
    if (!q) return;
    const t = setTimeout(() => {
      const href = `/?${params.toString()}`;
      const summary = summarizeFilters(params);
      const label = summary ? `${q} · ${summary}` : q;
      pushHistory({ label, href, q });
    }, 800);
    return () => clearTimeout(t);
  }, [sp]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    if (val.trim().length < 2) {
      setProducts([]); setCategories([]); setTotal(undefined); setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(val)}`, { signal: ctrl.signal });
        if (!r.ok) return;
        const data: Resp = await r.json();
        if (data.query !== val.trim()) return;
        setCategories(data.categories ?? []);
        setProducts(data.products ?? []);
        setTotal(data.total);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [val]);

  const showHistory = !val.trim() && history.length > 0;
  const showHits = val.trim().length >= 2;

  const items: Item[] = useMemo(() => {
    if (showHistory) {
      return history.map((h, i) => ({ kind: 'history', value: h, index: i }));
    }
    if (!showHits) return [];
    let i = 0;
    const out: Item[] = [];
    for (const c of categories) out.push({ kind: 'category', value: c, index: i++ });
    for (const p of products) out.push({ kind: 'product', value: p, index: i++ });
    if (products.length > 0 || categories.length > 0) {
      out.push({ kind: 'showAll', value: val.trim(), index: i++ });
    }
    return out;
  }, [showHistory, showHits, history, categories, products, val]);

  function buildSearchHref(query: string): string {
    const next = new URLSearchParams(sp.toString());
    if (query) next.set('q', query); else next.delete('q');
    next.delete('page');
    const qs = next.toString();
    return qs ? `/?${qs}` : '/';
  }

  function buildHistoryEntry(query: string, href: string): HistoryEntry {
    const params = new URL(href, 'http://x').searchParams;
    const summary = summarizeFilters(params);
    return { label: summary ? `${query} · ${summary}` : query, href };
  }

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      const next = new URLSearchParams(sp.toString());
      next.delete('q'); next.delete('page');
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : '/');
      setOpen(false);
      return;
    }
    // New query from the search box is a fresh search: drop existing
    // filters and pagination so results aren't constrained by leftover
    // facets from the previous query.
    const href = `/?q=${encodeURIComponent(trimmed)}`;
    pushHistory({ label: trimmed, href, q: trimmed });
    router.push(href);
    setOpen(false);
  }

  function selectCategory(c: CategoryHit) {
    const href = c.slug ? `/${c.slug}` : `/?categories=${c.id}`;
    pushHistory({ label: c.name, href });
    router.push(href);
    setOpen(false);
  }

  function selectProduct(p: ProductHit) {
    if (val.trim()) {
      const href = buildSearchHref(val);
      const entry = buildHistoryEntry(val, href);
      pushHistory({ ...entry, q: val });
    }
    router.push(p.href ?? `/p/${p.id}`);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      const it = items[active];
      if (!it) {
        submit(val);
        return;
      }
      e.preventDefault();
      if (it.kind === 'history') {
        router.push(it.value.href);
        setOpen(false);
      } else if (it.kind === 'category') {
        selectCategory(it.value);
      } else if (it.kind === 'product') {
        selectProduct(it.value);
      } else if (it.kind === 'showAll') {
        submit(val);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const filterCount = countActiveFilters(new URLSearchParams(sp.toString()));

  return (
    <div ref={wrapperRef} className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(val); }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={val}
          onChange={(e) => { setVal(e.target.value); setActive(-1); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Hae tuotteita..."
          autoComplete="off"
          enterKeyHint="search"
          className="flex-1 rounded-md bg-white px-4 py-3 text-base placeholder:text-muted border-0"
        />
        <button
          type="submit"
          className="rounded-md bg-ink px-5 py-3 text-paper text-sm font-medium hover:bg-black"
        >
          Hae
        </button>
      </form>

      {filterCount > 0 && val.trim() && (
        <div className="text-xs text-muted mt-1">
          Aktiiviset suodattimet pysyvät tallessa hakua tehdessäsi.
        </div>
      )}

      {open && (showHistory || showHits) && (
        <div className="acsl absolute z-20 left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto rounded-md bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] py-1 text-sm">
          {showHistory && (
            <>
              <SectionHeader>
                <span>Aiemmat haut</span>
                <button onClick={() => { clearHistory(); setHistory([]); }} className="text-ink/80 hover:text-ink normal-case tracking-normal">
                  Tyhjennä
                </button>
              </SectionHeader>
              {history.map((h, i) => (
                <div
                  key={h.href}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${active === i ? 'bg-paper' : 'hover:bg-paper'}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); router.push(h.href); setOpen(false); }}
                >
                  <span className="text-muted">↻</span>
                  <span className="flex-1">{h.label}</span>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setHistory(removeHistory(h.href)); }}
                    className="text-muted hover:text-ink px-1"
                    aria-label={`Poista ${h.label}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}

          {showHits && (
            <>
              {categories.length > 0 && (
                <>
                  <SectionHeader>
                    <span>Kategoriat</span>
                  </SectionHeader>
                  {categories.map((c) => {
                    const idx = items.findIndex((it) => it.kind === 'category' && it.value.id === c.id);
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${active === idx ? 'bg-paper' : 'hover:bg-paper'}`}
                        onMouseEnter={() => setActive(idx)}
                        onMouseDown={(e) => { e.preventDefault(); selectCategory(c); }}
                      >
                        <span className="text-muted">⌖</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-muted whitespace-nowrap text-xs">listasivu →</span>
                      </div>
                    );
                  })}
                </>
              )}

              <SectionHeader>
                <span>Tuotteet</span>
                {loading ? <span>haetaan…</span> : total != null && <span>{total.toLocaleString('fi-FI')} osumaa</span>}
              </SectionHeader>
              {loading && products.length === 0 && categories.length === 0 && (
                <SuggestSkeleton />
              )}
              {products.length === 0 && !loading && (
                <div className="px-3 py-3 text-muted">Ei osumia.</div>
              )}
              {products.map((p) => {
                const idx = items.findIndex((it) => it.kind === 'product' && it.value.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${active === idx ? 'bg-paper' : 'hover:bg-paper'}`}
                    onMouseEnter={() => setActive(idx)}
                    onMouseDown={(e) => { e.preventDefault(); selectProduct(p); }}
                  >
                    <div className="w-10 h-10 bg-paper flex-none overflow-hidden">
                      {p.image ? (
                        <HotlinkImage src={p.image} alt="" className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                    <span className="flex-1 line-clamp-1">{p.name}</span>
                    <span className="text-muted whitespace-nowrap">{p.price}</span>
                  </div>
                );
              })}
              {(products.length > 0 || categories.length > 0) && (
                <div
                  className={`px-3 py-2 cursor-pointer text-ink hover:bg-paper border-t border-line ${active === items.length - 1 ? 'bg-paper' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); submit(val); }}
                >
                  Näytä kaikki tulokset hakusanalle "<span className="font-medium">{val}</span>" →
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wide text-muted">
      {children}
    </div>
  );
}

function SuggestSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 skeleton flex-none rounded" />
          <div className="flex-1 h-3 skeleton rounded" />
          <div className="w-12 h-3 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}
