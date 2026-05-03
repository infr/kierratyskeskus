import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kierrätyskeskus mobile-friendly search',
  description: 'Mobiilikäyttöinen näkymä kauppa.kierratyskeskus.fi -tuotteille suodattimineen.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className="min-h-screen flex flex-col">
        <header className="bg-paper">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-baseline gap-3">
            <a href="/" className="font-semibold text-lg tracking-tight">Kierrätyskeskus</a>
            <span className="text-xs text-muted hidden sm:inline">epävirallinen mobiilihaku</span>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-12">{children}</main>
        <footer className="mt-8 py-6 text-xs text-muted text-center">
          Tiedot:{' '}
          <a className="underline underline-offset-2 hover:text-ink" href="https://kauppa.kierratyskeskus.fi" target="_blank" rel="noreferrer">
            kauppa.kierratyskeskus.fi
          </a>
          . Ei virallinen.
        </footer>
      </body>
    </html>
  );
}
