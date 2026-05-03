export type HistoryEntry = { label: string; href: string; q?: string };

const KEY = 'kk:history:v2';
const EVENT = 'kk:history-change';
const LIMIT = 8;

function broadcast() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENT));
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is HistoryEntry =>
        e && typeof e === 'object' && typeof e.label === 'string' && typeof e.href === 'string',
      )
      .map((e) => ({ ...e, q: typeof e.q === 'string' ? e.q : undefined }));
  } catch {
    return [];
  }
}

export function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  if (typeof window === 'undefined' || !entry.label.trim()) return readHistory();
  const cur = readHistory();
  // If the entry has a query, dedupe by query so refining filters on the same
  // search replaces the older snapshot. Otherwise dedupe by exact href.
  const dedup = entry.q
    ? (e: HistoryEntry) => e.q?.toLowerCase() !== entry.q!.toLowerCase()
    : (e: HistoryEntry) => e.href !== entry.href;
  const next = [entry, ...cur.filter(dedup)].slice(0, LIMIT);
  try { localStorage.setItem(KEY, JSON.stringify(next)); broadcast(); } catch {}
  return next;
}

export function removeHistory(href: string): HistoryEntry[] {
  const next = readHistory().filter((e) => e.href !== href);
  try { localStorage.setItem(KEY, JSON.stringify(next)); broadcast(); } catch {}
  return next;
}

export function clearHistory(): void {
  try { localStorage.removeItem(KEY); broadcast(); } catch {}
}

export function onHistoryChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function countActiveFilters(sp: URLSearchParams): number {
  let n = 0;
  for (const [k, v] of sp.entries()) {
    if (k === 'q' || k === 'page') continue;
    if (!v) continue;
    n += k === 'priceMin' || k === 'priceMax' ? 1 : v.split(',').length;
  }
  return n;
}

export function summarizeFilters(sp: URLSearchParams): string {
  const n = countActiveFilters(sp);
  if (!n) return '';
  return n === 1 ? '1 suodatin' : `${n} suodatinta`;
}
