'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readHistory, removeHistory, clearHistory, onHistoryChange } from '@/lib/history';

export function RecentSearches() {
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
    setHydrated(true);
    return onHistoryChange(() => setHistory(readHistory()));
  }, []);

  if (!hydrated || history.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted">Aiemmat haut</span>
      <ul className="flex flex-wrap gap-2 flex-1 min-w-0">
        {history.map((q) => (
          <li key={q}>
            <span className="inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-black/5 pl-3 pr-1 py-1 text-sm">
              <button
                type="button"
                className="hover:text-ink"
                onClick={() => router.push(`/?q=${encodeURIComponent(q)}`)}
              >
                {q}
              </button>
              <button
                type="button"
                aria-label={`Poista ${q}`}
                className="text-muted hover:text-ink w-5 h-5 inline-flex items-center justify-center rounded-full"
                onClick={() => setHistory(removeHistory(q))}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="text-xs text-muted hover:text-ink"
        onClick={() => { clearHistory(); setHistory([]); }}
      >
        Tyhjennä
      </button>
    </div>
  );
}
