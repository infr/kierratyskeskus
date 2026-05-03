'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { pushHistory, readHistory, removeHistory, clearHistory, onHistoryChange } from '@/lib/history';
import { rememberSearch } from '@/components/BackToSearch';

type Suggestion = { id: string | number; name: string; price: string; image: string | null };
type Resp = { query: string; products: Suggestion[]; total?: number };

export function SearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [history, setHistory] = useState<string[]>([]);
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
      setHits([]); setTotal(undefined); setLoading(false);
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
        setHits(data.products);
        setTotal(data.total);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [val]);

  const showHistory = !val.trim() && history.length > 0;
  const showHits = val.trim().length >= 2;

  const items = useMemo(() => {
    if (showHistory) return history.map((h) => ({ kind: 'history' as const, value: h }));
    if (showHits) return hits.map((h) => ({ kind: 'hit' as const, value: h }));
    return [];
  }, [showHistory, showHits, history, hits]);

  function submit(query: string) {
    if (!query.trim()) {
      const next = new URLSearchParams(sp.toString());
      next.delete('q'); next.delete('page');
      router.push(`/?${next.toString()}`);
      setOpen(false);
      return;
    }
    setHistory(pushHistory(query));
    const next = new URLSearchParams(sp.toString());
    next.set('q', query);
    next.delete('page');
    router.push(`/?${next.toString()}`);
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
      if (it && it.kind === 'hit') {
        e.preventDefault();
        setHistory(pushHistory(val));
        router.push(`/p/${it.value.id}`);
        setOpen(false);
      } else if (it && it.kind === 'history') {
        e.preventDefault();
        setVal(it.value);
        submit(it.value);
      } else {
        submit(val);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

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

      {open && (showHistory || showHits) && (
        <div className="acsl absolute z-20 left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto rounded-md bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] py-1 text-sm">
          {showHistory && (
            <>
              <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wide text-muted">
                <span>Aiemmat haut</span>
                <button onClick={() => { clearHistory(); setHistory([]); }} className="text-ink/80 hover:text-ink normal-case tracking-normal">
                  Tyhjennä
                </button>
              </div>
              {history.map((h, i) => (
                <div
                  key={h}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${active === i ? 'bg-paper' : 'hover:bg-paper'}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); setVal(h); submit(h); }}
                >
                  <span className="text-muted">↻</span>
                  <span className="flex-1">{h}</span>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setHistory(removeHistory(h)); }}
                    className="text-muted hover:text-ink px-1"
                    aria-label={`Poista ${h}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}

          {showHits && (
            <>
              <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wide text-muted">
                <span>Tuotteet</span>
                {loading ? <span>haetaan…</span> : total != null && <span>{total.toLocaleString('fi-FI')} osumaa</span>}
              </div>
              {hits.length === 0 && !loading && (
                <div className="px-3 py-3 text-muted">Ei osumia.</div>
              )}
              {hits.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${active === i ? 'bg-paper' : 'hover:bg-paper'}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pushHistory(val);
                    router.push(`/p/${h.id}`);
                    setOpen(false);
                  }}
                >
                  <div className="w-10 h-10 bg-paper flex-none overflow-hidden">
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image} alt="" className="w-full h-full object-contain" />
                    ) : null}
                  </div>
                  <span className="flex-1 line-clamp-1">{h.name}</span>
                  <span className="text-muted whitespace-nowrap">{h.price}</span>
                </div>
              ))}
              {hits.length > 0 && (
                <div
                  className={`px-3 py-2 cursor-pointer text-ink hover:bg-paper border-t border-line ${active === hits.length ? 'bg-paper' : ''}`}
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
