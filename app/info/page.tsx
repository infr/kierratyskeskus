import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Tietoa sivustosta | ${SITE_NAME}`,
  description:
    'Epävirallinen saavutettavuuspeili kauppa.kierratyskeskus.fi-sivustolle. Mobiilisuodattimet toimivat, kun alkuperäisessä eivät.',
  robots: { index: true, follow: true },
};

export default function InfoPage() {
  return (
    <article className="prose prose-sm sm:prose-base max-w-2xl mx-auto py-6 space-y-8 text-ink">
      <a href="/" className="text-sm text-muted hover:text-ink inline-block">
        ← Takaisin
      </a>

      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tietoa sivustosta</h1>

        <p>
          Pääkaupunkiseudun Kierrätyskeskuksen verkkokaupan{' '}
          <a
            href="https://kauppa.kierratyskeskus.fi"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            kauppa.kierratyskeskus.fi
          </a>{' '}
          mobiilinäkymästä puuttuu kategoriasuodatin. Selain ei pysty rajaamaan tuotteita kategorioittain ilman työpöytäversiota. Ilmoitin bugista helmikuussa 2025, eikä se ole sen jälkeen korjautunut.
        </p>

        <p>
          Tämä sivusto on epävirallinen saavutettavuuspeili, joka palauttaa puuttuvan suodattimen mobiilissa. Sivustoa ei ylläpidä Pääkaupunkiseudun Kierrätyskeskus Oy.
        </p>

        <h2 className="text-lg font-semibold tracking-tight mt-6">Mitä sivusto tekee</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hakee tuotetiedot reaaliaikaisesti kauppa.kierratyskeskus.fi-rajapinnasta.</li>
          <li>Linkittää tuotekuvat suoraan alkuperäisestä lähteestä (ei tallenna kuvia).</li>
          <li>Tarjoaa toimivan kategoriasuodattimen mobiilissa.</li>
          <li>Ohjaa Osta-napin suoraan kauppa.kierratyskeskus.fi-tuotesivulle.</li>
        </ul>

        <h2 className="text-lg font-semibold tracking-tight mt-6">Mitä sivusto ei tee</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ei myy mitään. Kaikki ostot tapahtuvat kauppa.kierratyskeskus.fi-sivustolla.</li>
          <li>Ei näytä mainoksia.</li>
          <li>Ei tallenna käyttäjätietoja eikä aseta seurantaevästeitä.</li>
          <li>Ei säilytä tuotedataa tai tuotekuvia palvelimellaan.</li>
        </ul>

        <h2 className="text-lg font-semibold tracking-tight mt-6">Yhteydenotto ja poisto</h2>
        <p>
          Sivusto poistetaan välittömästi, jos Pääkaupunkiseudun Kierrätyskeskus Oy sitä pyytää. Sivusto poistetaan myös, kun alkuperäisen verkkokaupan mobiilisuodatin toimii uudelleen.
        </p>
        <p>
          Yhteystiedot:{' '}
          <a
            href="https://kimsalmi.com/cv/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            kimsalmi.com/cv
          </a>
          .
        </p>
      </section>

      <hr className="border-line/60" />

      <section lang="en" className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">About this site</h1>

        <p>
          The mobile view of Pääkaupunkiseudun Kierrätyskeskus&rsquo; online store{' '}
          <a
            href="https://kauppa.kierratyskeskus.fi"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            kauppa.kierratyskeskus.fi
          </a>{' '}
          is missing the category filter. On mobile you can&rsquo;t narrow products by category without switching to the desktop view. I reported the bug in February 2025 and it hasn&rsquo;t been fixed since.
        </p>

        <p>
          This site is an unofficial accessibility mirror that restores the missing filter on mobile. It is not run by, or affiliated with, Pääkaupunkiseudun Kierrätyskeskus Oy.
        </p>

        <h2 className="text-lg font-semibold tracking-tight mt-6">What this site does</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fetches product data live from the kauppa.kierratyskeskus.fi API.</li>
          <li>Hot-links product images directly from the source (does not store images).</li>
          <li>Provides a working category filter on mobile.</li>
          <li>Sends the Buy button straight to the matching kauppa.kierratyskeskus.fi product page.</li>
        </ul>

        <h2 className="text-lg font-semibold tracking-tight mt-6">What this site does not do</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Sell anything. All purchases happen on kauppa.kierratyskeskus.fi.</li>
          <li>Show ads.</li>
          <li>Store user data or set tracking cookies.</li>
          <li>Keep a copy of product data or product images on the server.</li>
        </ul>

        <h2 className="text-lg font-semibold tracking-tight mt-6">Contact and takedown</h2>
        <p>
          The site will be taken down on request from Pääkaupunkiseudun Kierrätyskeskus Oy. It will also be taken down once the original mobile filter works again.
        </p>
        <p>
          Contact:{' '}
          <a
            href="https://kimsalmi.com/cv/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            kimsalmi.com/cv
          </a>
          .
        </p>
      </section>
    </article>
  );
}
