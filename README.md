# Pantheon

A personal daily-learning app. One theme a day, six resonant facets, explored at the
reader's pace. An antidote to shallow feeds, built by and for one reader. The goal is
depth and delight, not reach.

Each day presents one theme as six words on a dark field, one per facet. Each facet is
hidden until tapped, then reveals a short, sourced piece: a **Person**, a **Picture**, a
**Poem**, a **Principle**, a **Passage**, and a **Parallel**. The six are chosen to
rhyme. A new theme unlocks once per day; the sequence waits if you miss a day.

See [`prd-1.md`](prd-1.md) for the product spec, [`editorial-charter.md`](editorial-charter.md)
for the standard every day of content is held to, and [`data-model.md`](data-model.md)
for the content model.

## Tech

React + Vite + TypeScript + Tailwind + Zustand. Local-first: no backend, no accounts.
Content ships as portable JSON, lazy-loaded one day at a time. Reader state (current day,
per-day open record, per-facet read state) is persisted to `localStorage`.

## Getting started

```bash
npm install
npm run dev        # build content manifest, validate, then start the dev server
```

Open the printed local URL. The app starts on Day 1, "Hubris".

## Scripts

| command | what it does |
| --- | --- |
| `npm run dev` | validate content, then start Vite |
| `npm run build` | typecheck, validate content, then build for production |
| `npm run preview` | preview the production build |
| `npm run typecheck` | `tsc --noEmit` over app and scripts |
| `npm run lint` | ESLint + Prettier check |
| `npm run format` | Prettier write |
| `npm test` | Vitest (unit, component, and the content gate) |
| `npm run validate` | run the content trust gate on its own |
| `npm run build-manifest` | regenerate `content/manifest.json` and copy content to `public/` |

## Content pipeline

The library is produced separately from the app runtime. The app only reads finished JSON.

| command | role |
| --- | --- |
| `npm run map` | query the library's coverage (registers, regions, eras) and report gaps |
| `npm run scout` | propose candidate themes/entities aimed at the biggest gaps |
| `npm run deep -- --day N --slug <slug> --theme <Theme>` | scaffold a new day to charter standard |
| `npm run validate` | the trust gate: schema plus the charter's enforceable rules |

Coverage is queried, not remembered: the scripts read the actual content every run.

## Repository layout

```
content/      authored days, entity ledger, vocabulary, images
schema/       JSON Schema for days, entities, vocabulary
scripts/      content pipeline (map, scout, deep) and validation
src/
  content/    canonical types and the day/manifest loaders
  store/       Zustand store, persistence, day-advance logic, metrics
  components/  the grid screen and facet views
  lib/         shared helpers (word count, facet labels)
```

## Content standards

Every claim rests on a source. Images are public domain or Creative Commons with
attribution. Poems still in copyright are excerpted and pointed to, never reproduced in
full. A day cannot ship without naming the threads that connect its facets. These rules
are enforced by `npm run validate`, which also runs as part of `npm test` and CI.
