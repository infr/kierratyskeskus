'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function Pagination({ page, lastPage }: { page: number; lastPage: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  if (lastPage <= 1) return null;

  function go(p: number) {
    const next = new URLSearchParams(sp.toString());
    if (p > 1) next.set('page', String(p)); else next.delete('page');
    router.push(`/?${next.toString()}`);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-8 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-md bg-white px-4 py-2 disabled:opacity-30 hover:text-ink text-muted"
      >
        ← Edellinen
      </button>
      <span className="text-muted text-xs">
        Sivu {page} / {lastPage.toLocaleString('fi-FI')}
      </span>
      <button
        disabled={page >= lastPage}
        onClick={() => go(page + 1)}
        className="rounded-md bg-white px-4 py-2 disabled:opacity-30 hover:text-ink text-muted"
      >
        Seuraava →
      </button>
    </div>
  );
}
