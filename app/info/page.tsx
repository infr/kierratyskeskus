import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Tietoa sivustosta | ${SITE_NAME}`,
  description:
    'Miksi tämä sivusto on olemassa: mobiiliystävällinen käyttöliittymä kauppa.kierratyskeskus.fi-sivustolle, joka lisää puuttuvan kategoriasuodattimen.',
  robots: { index: true, follow: true },
};

export default function InfoPage() {
  return (
    <article className="prose prose-sm sm:prose-base max-w-2xl mx-auto py-6 space-y-5 text-ink">
      <a href="/" className="text-sm text-muted hover:text-ink inline-block">
        ← Takaisin
      </a>
      <h1 className="text-2xl font-semibold tracking-tight">Tietoa sivustosta</h1>

      <p>
        Pääkaupunkiseudun Kierrätyskeskuksella on hyödyllinen verkkokauppa osoitteessa{' '}
        <a
          href="https://kauppa.kierratyskeskus.fi"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          kauppa.kierratyskeskus.fi
        </a>
        . Mobiilissa kategoriasuodatin puuttuu &mdash; et voi selata tuotteita kategorioittain ellet käytä työpöytäversiota.
      </p>

      <p>
        Ilmoitin bugista 1,5 vuotta sitten. He kuittasivat sen, lupasivat tutkia asiaa, ja kertoivat sitten odottavansa ratkaisua jostain. Sen jälkeen mikään ei ole muuttunut.
      </p>

      <p>
        Tämä sivusto on se ratkaisu. Se on mobiiliystävällinen käyttöliittymä, joka lisää puuttuvan suodattimen. Kaikki tuotetiedot, kuvat ja hinnat tulevat Kierrätyskeskukselta. Osta-nappi vie suoraan heidän kauppaansa &mdash; ostokset tapahtuvat siellä, ei täällä.
      </p>

      <p>
        En myy mitään. Sivustolla ei ole mainoksia. En tallenna käyttäjädataa. Sillä hetkellä kun Kierrätyskeskus korjaa suodattimen mobiilisivustollaan, tämä sivusto käy tarpeettomaksi ja poistan sen.
      </p>
    </article>
  );
}
