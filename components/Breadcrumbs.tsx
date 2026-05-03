import Link from 'next/link';
import type { ReactNode } from 'react';

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Murupolku"
      className={`text-xs text-muted flex flex-wrap items-center gap-1 ${className}`}
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <Sep />}
            {c.href && !isLast ? (
              <Link href={c.href} className="hover:text-ink underline-offset-2 hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-ink' : ''}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Sep(): ReactNode {
  return <span className="text-muted" aria-hidden>›</span>;
}
