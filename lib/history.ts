const KEY = 'kk:history';
const LIMIT = 8;

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
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function removeHistory(q: string): string[] {
  const next = readHistory().filter((s) => s !== q);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearHistory(): void {
  try { localStorage.removeItem(KEY); } catch {}
}
