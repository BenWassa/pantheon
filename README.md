# Pantheon

A personal daily-learning app. One theme a day, six resonant facets, explored at the
reader's pace. An antidote to shallow feeds, built by and for one reader. The goal is
depth and delight, not reach.

Each day presents one theme as six words on a dark field, one per facet. Each facet is
hidden until tapped, then reveals a short, sourced piece: a **Person**, a **Picture**, a
**Poem**, a **Principle**, a **Passage**, and a **Parallel**. The six are chosen to
rhyme. A new theme unlocks once per day; the sequence waits if you miss a day.

See [`prd-1.md`](prd-1.md) for the product spec, [`editorial-charter.md`](editorial-charter.md)
for the standard every day of content is held to, [`data-model.md`](data-model.md)
for the content model, and [`studio.md`](studio.md) for the private review layer
where AI-generated content is judged before it ships.

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
| `npm run sync` | reconcile the entity ledger's `usedInDays`/status from the day files (`-- --check` to fail on drift) |
| `npm run studio` | open the private review layer (the Studio) for judging AI-generated content |
| `npm run studio:report` | turn captured judgments into a prioritized revision queue |

## Content pipeline

The library is produced separately from the app runtime. The app only reads finished JSON.

| command | role |
| --- | --- |
| `npm run map` | query coverage (registers, regions, eras), prioritized gaps, Western-lean and reuse flags, ledger health |
| `npm run scout` | propose candidates aimed at the biggest gaps; `-- --write --slug <s> --label <l> --type <t>` records one in the ledger |
| `npm run deep -- --day N --slug <slug> --theme <Theme>` | scaffold a new day to charter standard |
| `npm run validate` | the trust gate: schema plus the charter's enforceable rules |
| `npm run sync` | reconcile the ledger to what the days actually reference |

Coverage is queried, not remembered: the scripts read the actual content every run.

## Review layer (Studio)

The Studio is a private, dev-only judgment layer for AI-generated content. It presents
the corpus as a fast feed at three scales (whole day, single facet, single line) and
captures instinctive verdicts (keep / flat / fix / cut), signal tags, and notes into a
durable, git-tracked ledger (`content/judgments.jsonl`). `npm run studio:report` turns
those judgments into a prioritized revision queue and surfaces trust risks. The reader
build never includes the Studio or the ledger. See [`studio.md`](studio.md).

The pipeline is a loop: **map** finds the biggest gap, **scout --write** records a candidate
against it, **deep** scaffolds the day, the author researches and fills it, **validate** holds it
to the charter, and **sync** keeps the ledger honest. The ledger's `usedInDays` and used-status are
derived from the day files, never hand-kept, so the loop stays trustworthy as the library scales.

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
full. A day cannot ship without naming the threads that connect its facets. A
`published` day may carry no placeholder or scaffold text, and its six grid words must be
distinct. The gate also surfaces taste-rule and balance signals as warnings: greatest-hits
entities in use, an entity leaned on across too many days, and a ledger that has drifted out
of sync. These rules are enforced by `npm run validate`, which also runs as part of `npm test`
and CI.
