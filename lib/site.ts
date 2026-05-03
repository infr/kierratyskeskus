export const SITE_URL = 'https://kierratyskeskus.kimsalmi.com';
export const SITE_NAME = 'Kierrätyskeskus mobiilihaku';
export const SITE_TAGLINE =
  'Mobiilikäyttöinen haku ja suodattimet kauppa.kierratyskeskus.fi -tuotteille.';

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}
