'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Category } from '@/lib/api';
import { categoryHref, getRoots, getChildren } from '@/lib/categories';

export function CategoriesMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close after the URL changes (link inside the dropdown was followed)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const roots = getRoots(categories).sort((a, b) =>
    a.name.localeCompare(b.name, 'fi'),
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted hover:text-ink flex items-center gap-1"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Kategoriat
        <span className={`text-xs transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 left-0 mt-2 w-[min(92vw,560px)] max-h-[70vh] overflow-y-auto bg-white rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 p-3"
        >
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
            {roots.map((r) => (
              <RootEntry key={r.id} root={r} categories={categories} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RootEntry({
  root,
  categories,
}: {
  root: Category;
  categories: Category[];
}) {
  const children = getChildren(categories, root.id).sort((a, b) =>
    a.name.localeCompare(b.name, 'fi'),
  );

  if (children.length === 0) {
    return (
      <li>
        <a
          href={categoryHref(root.slug)}
          className="block py-1.5 text-sm text-ink/90 hover:text-ink"
        >
          {root.name}
        </a>
      </li>
    );
  }

  return (
    <li>
      <details className="group/cat">
        <summary className="cursor-pointer list-none flex items-center gap-2 py-1.5">
          <span className="text-muted text-xs transition group-open/cat:rotate-90 inline-block w-3">›</span>
          <a
            href={categoryHref(root.slug)}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm text-ink/90 hover:text-ink"
          >
            {root.name}
          </a>
        </summary>
        <ul className="ml-5 border-l border-line/80 pl-2 space-y-0.5">
          {children.map((c) => (
            <li key={c.id}>
              <a
                href={categoryHref(c.slug)}
                className="block py-1 text-sm text-ink/90 hover:text-ink"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
