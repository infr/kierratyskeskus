import type { Metadata } from 'next';
import './globals.css';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Kaikki tuotteet ja suodattimet mobiilissa`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: [
    'kierrätyskeskus',
    'käytetyt tavarat',
    'kirpputori',
    'second hand',
    'pääkaupunkiseutu',
    'kierrätys',
    'mobiilihaku',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'fi_FI',
    url: SITE_URL,
    title: `${SITE_NAME} | Kaikki tuotteet ja suodattimet mobiilissa`,
    description: SITE_TAGLINE,
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} | Kaikki tuotteet ja suodattimet mobiilissa`,
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className="min-h-screen flex flex-col">
        <header className="bg-paper border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
            <a href="/" className="text-muted hover:text-ink">Etusivu</a>
            <a href="/info" className="text-muted hover:text-ink">Lisätietoja</a>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-12">{children}</main>
        <footer className="mt-8 py-6 text-xs text-muted text-center px-4">
          Epävirallinen mobiilinäkymä. Tuotteet, kuvat ja hinnat tulevat{' '}
          <a className="underline underline-offset-2 hover:text-ink" href="https://kauppa.kierratyskeskus.fi" target="_blank" rel="noreferrer">
            kauppa.kierratyskeskus.fi
          </a>
          -sivustolta, jossa myös ostokset tehdään.{' '}
          <a className="underline underline-offset-2 hover:text-ink" href="/info">
            Lisätietoja
          </a>
          .
        </footer>
        <JsonLd data={websiteJsonLd} />
      </body>
    </html>
  );
}
