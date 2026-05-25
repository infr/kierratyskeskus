'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductImage, ImageSizes } from '@/lib/api';
import { HotlinkImage } from './HotlinkImage';

function pickSize(sizes: ImageSizes, preferred: (keyof ImageSizes)[]): string | undefined {
  for (const k of preferred) if (sizes[k]) return sizes[k];
  return undefined;
}

const MAIN_PREF: (keyof ImageSizes)[] = ['large', 'medium', 'full', 'original', 'small'];
const ZOOM_PREF: (keyof ImageSizes)[] = ['full', 'original', 'large', 'medium', 'small'];
const SWIPE_THRESHOLD = 40;
const ZOOM_SCALE = 2;

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const touchX = useRef<number | null>(null);

  const total = images.length;

  const next = useCallback(() => {
    if (total > 1) {
      setIdx((i) => (i + 1) % total);
      setZoomed(false);
    }
  }, [total]);
  const prev = useCallback(() => {
    if (total > 1) {
      setIdx((i) => (i - 1 + total) % total);
      setZoomed(false);
    }
  }, [total]);

  // Reset zoom when image changes via dot click.
  useEffect(() => { setZoomed(false); }, [idx]);

  if (total === 0) {
    return (
      <div className="aspect-square flex items-center justify-center text-muted bg-white rounded-md ring-1 ring-black/5">
        ei kuvaa
      </div>
    );
  }

  const cur = images[idx];
  const mainSrc = pickSize(cur.sizes, MAIN_PREF);
  const zoomSrc = pickSize(cur.sizes, ZOOM_PREF);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next(); else prev();
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin({ x, y });
  }

  return (
    <div>
      <div
        className="relative bg-white rounded-md ring-1 ring-black/5 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setOrigin({ x: 50, y: 50 })}
      >
        <button
          type="button"
          onClick={() => setZoomed((v) => !v)}
          className="block w-full"
          aria-label={zoomed ? 'Pienennä kuva' : 'Suurenna kuva'}
          aria-pressed={zoomed}
        >
          <HotlinkImage
            src={(zoomed ? zoomSrc ?? mainSrc : mainSrc) ?? ''}
            alt={alt}
            draggable={false}
            className={`w-full h-auto object-contain select-none transition-transform duration-150 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            style={{
              transform: zoomed ? `scale(${ZOOM_SCALE})` : 'none',
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          />
        </button>

        {total > 1 && !zoomed && (
          <>
            <ArrowButton side="left" onClick={prev} ariaLabel="Edellinen kuva" />
            <ArrowButton side="right" onClick={next} ariaLabel="Seuraava kuva" />
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3" role="tablist" aria-label="Kuvat">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Näytä kuva ${i + 1} / ${total}`}
              aria-current={i === idx}
              className={`w-2 h-2 rounded-full transition ${i === idx ? 'bg-ink' : 'bg-muted/40 hover:bg-muted'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
  ariaLabel,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  ariaLabel: string;
}) {
  const pos = side === 'left' ? 'left-2' : 'right-2';
  const glyph = side === 'left' ? '‹' : '›';
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={ariaLabel}
      className={`absolute top-1/2 -translate-y-1/2 ${pos} w-9 h-9 rounded-full bg-white/85 hover:bg-white ring-1 ring-black/5 shadow-sm flex items-center justify-center text-xl leading-none`}
    >
      {glyph}
    </button>
  );
}
