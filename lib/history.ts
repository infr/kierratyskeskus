const KEY = 'kk:history';
const EVENT = 'kk:history-change';
const LIMIT = 8;

function broadcast() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENT));
}

export function readHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function pushHistory(q: string): string[] {
  if (typeof window === 'undefined' || !q.trim()) return readHistory();
  const cur = readHistory();
  const next = [q.trim(), ...cur.filter((s) => s.toLowerCase() !== q.trim().toLowerCase())].slice(0, LIMIT);
  try { localStorage.setItem(KEY, JSON.stringify(next)); broadcast(); } catch {}
  return next;
}

export function removeHistory(q: string): string[] {
  const next = readHistory().filter((s) => s !== q);
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
