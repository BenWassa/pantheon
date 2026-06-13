# Pantheon Data Model

*The content model the PRD refers to. The canonical types live in
[`src/content/types.ts`](src/content/types.ts); the JSON Schemas under
[`schema/`](schema/) mirror them and are enforced by the validator. When this
document and the code disagree, the code wins.*

## Files

```
content/
  days/NNN-slug.json   one file per day; the NNN prefix is the day index
  entities.json        the entity ledger (dedupe + graph nodes)
  vocab.json           controlled vocabulary: registers, regions, eras
  manifest.json        GENERATED, app-facing, ordered index of published days
  images/              local public-domain / Creative Commons image assets
schema/
  day.schema.json
  entities.schema.json
  vocab.schema.json
```

Content is plain, portable JSON. At dev/build time `scripts/build-manifest.ts`
writes `manifest.json` and copies `content/` into `public/content/`, which the app
fetches one day at a time. `manifest.json` and `public/content/` are generated and
git-ignored.

## A Day

Each day is one theme illuminated by six fixed facets, always in the order
**Person, Picture, Poem, Principle, Passage, Parallel**.

| field | notes |
| --- | --- |
| `schemaVersion` | always `1` |
| `index` | 1-based; must equal the `NNN` filename prefix |
| `slug` | kebab-case; must equal the filename slug |
| `theme` | display title, e.g. "Hubris" |
| `status` | `draft` → `review` → `ready` → `published`; only `published` reaches the app |
| `registers` | one or more of the six charter registers (closed vocabulary) |
| `regions`, `eras` | ids from `vocab.json` (open, controlled) |
| `facets` | the six keyed facets (see below) |
| `resonanceThreads` | **at least one required**; the named cross-links between facets |
| `notes` | editorial notes, never shown to the reader |

### Facets

Every facet carries `key`, `oneWord` (the single word shown on the dark grid),
`title`, `body` (80–130 words, no em dashes), and `sources` (at least one). Two
facets extend this:

- **Picture** adds `image`: `src`, `alt`, `attribution`, `license`
  (`PD | CC0 | CC-BY | CC-BY-SA | CC-BY-4.0 | CC-BY-SA-4.0`), `sourceUrl`, and
  optionally `commonsFile`, `width`, `height`. Public domain or Creative Commons only.
- **Poem** adds `poem`, a discriminated union:
  - `{ status: "public-domain", full }` — shown in full.
  - `{ status: "in-copyright", excerpt?, pointerUrl, pointerLabel }` — a short excerpt
    plus a pointer to a licensed source. Never the full text.

  Passage may add `attribution`; Poem may add `poet`.

Facets may reference the ledger via `entities: [{ slug, qid?, role? }]`.

## Resonance threads

The charter's non-negotiable rule, made structural: a day must name at least one
thread, each connecting two or more facets. The validator rejects a day with none.

```json
{ "facets": ["poem", "picture"], "note": "Auden's poem is about this exact Bruegel." }
```

## Entity ledger (`entities.json`)

Entities are the dedupe memory and the nodes of a future graph. Identity is the
`slug` (primary key) plus a Wikidata `qid` where one exists.

| field | notes |
| --- | --- |
| `slug` | primary key, kebab-case |
| `qid` | Wikidata QID (`^Q\d+$`); preferred but optional |
| `type` | `person \| artwork \| poem \| text \| place \| concept \| event` |
| `label` | display name |
| `status` | `candidate \| researched \| used \| rejected` (rejected is kept for dedupe) |
| `usedInDays` | day indices referencing this entity |
| `registers`, `regions`, `eras`, `aliases`, `notes` | optional |

The validator warns (does not fail) when a `person`, `artwork`, `place`, or `event`
entity has no QID. We omit a QID rather than invent one: a fabricated identifier is
the same trust failure as a fabricated source.

## Controlled vocabulary (`vocab.json`)

- **Registers** (closed, exactly the charter's six): elegy, redemption, defiance,
  tenderness, comedy, awe.
- **Regions** and **eras**: open lists of `{ id, label }` (eras may add `from`/`to`
  years). Days and entities tag with these ids; the validator checks membership.

## Validation rules

`scripts/validate.ts` (and the Vitest content gate) enforce, beyond the JSON Schema:
at least one source per facet; no em dash (en dash warns); 80–130 word bodies;
single-token `oneWord`, and the six grid words distinct within a day; at least one
resonance thread connecting ≥2 facets; register in the closed set and region/era in the
vocab; filename ↔ index ↔ slug consistency; entity cross-references resolve with valid
QIDs; in-copyright poems carry no full text; no placeholder or scaffold text in a
`published` day; and unique, gap-free day indices (gaps warn).

Library-wide signals are reported as warnings (they shape editorial direction rather than
block a single day): an entity's stored `usedInDays` drifting from what the days actually
reference (`npm run sync` repairs it), an entity reused across too many days, and a
greatest-hits entity in use.

## Ledger reconciliation

`usedInDays` and the `used` status are derived truth, not hand-kept bookkeeping.
`scripts/lib/ledger.ts` recomputes them from the day files: `npm run sync` rewrites the
ledger (promoting a referenced candidate to `used`, correcting `usedInDays`, and flagging
orphans whose days no longer reference them), and `npm run sync -- --check` fails on any
drift for CI. The validator surfaces the same drift as a warning. This is what keeps the
ledger honest as the library scales past a handful of days.

## Open / deferred

- **graphify**: the explicit graph edge-export format and tool are deferred. The
  ledger (`usedInDays`, typed entities) is already graph-ready.
