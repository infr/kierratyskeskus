'use client';
import { useEffect, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  style?: React.CSSProperties;
};

export function HotlinkImage({ src, alt, className, loading, draggable, style }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (failed) {
    return (
      <div
        className={`${className ?? ''} flex items-center justify-center text-muted text-xs bg-paper`}
        style={style}
        role="img"
        aria-label={alt}
      >
        Kuva ei saatavilla
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      draggable={draggable}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
