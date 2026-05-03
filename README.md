# kierratyskeskus

Mobile-friendly search for [kauppa.kierratyskeskus.fi](https://kauppa.kierratyskeskus.fi).

The official site hides all filters on mobile via CSS, which makes it hard to narrow down 200k+ items on a phone. This is a small Next.js front-end that talks to their public Flowvy backend (`/backend/api/v1/products`) and renders the same data with filters that work on every screen size.

Live: [kierratyskeskus.kimsalmi.com](https://kierratyskeskus.kimsalmi.com)

Not affiliated with Pääkaupunkiseudun Kierrätyskeskus. The Buy button on every product just opens the original page on their site.

## Run locally

```bash
pnpm install
pnpm dev   # http://localhost:3737
```
