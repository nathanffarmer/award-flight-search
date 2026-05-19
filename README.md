# award-flight-search

A watched-trips dashboard for award flight availability, modeled on the
[seats.aero](https://seats.aero) `/search` response shape. Runs against
deterministic mock data out of the box; set `SEATS_AERO_API_KEY` and wire up
the live branch in `src/lib/server/seats-aero.ts` to point at the real API.

## Develop

```sh
npm install
npm run dev
```

## Scripts

| script | what it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run check` | `svelte-check` + TypeScript |
| `npm run screenshots` | Regenerate `docs/screenshots/*.png` |

## Screenshots

`npm run screenshots` spins up `vite dev` on port 5179, drives the UI with
Playwright (seeded with a sample watchlist via `localStorage`), and writes
PNGs to `docs/screenshots/` in both light and dark color schemes. The
generated images are committed so they show up in the PR/README without a
build step.

**One-time setup:** Playwright is pinned to `1.56.1` in `devDependencies`,
but the browser binary is downloaded separately:

```sh
npx playwright install chromium
```
