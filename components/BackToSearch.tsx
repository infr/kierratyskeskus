'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'kk:lastSearch';

export function rememberSearch(href: string) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(KEY, href); } catch {}
}

export function BackToSearch() {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(KEY);
      setHref(v && v !== window.location.pathname + window.location.search ? v : null);
    } catch {}
  }, []);

  return (
    <Link
      href={href ?? '/'}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      ← {href ? 'Takaisin hakuun' : 'Etusivulle'}
    </Link>
  );
}
