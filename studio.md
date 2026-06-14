# Pantheon Studio

*A private human-judgment layer. The reader app consumes finished content; the
Studio is where finished content gets decided.*

Pantheon's scarce asset is taste. AI can generate many candidate days, facets,
sentences, titles, and reveal words; quality depends on rapid human discernment of
what feels alive, what feels flat, what belongs, and what reads like Pantheon. The
Studio turns those instinctive reactions into durable signals that drive revision.

It is deliberately **not a polished UI project**. It is a content and copywriting
judgment system that happens to present as a fast, feed-like review surface.

## Running it

```bash
npm run studio          # opens the Studio against the dev server
npm run studio:report   # turns the captured judgments into a revision queue
```

The Studio is **dev-only**. Its API is a Vite middleware that runs only under
`vite serve`, so the reader's production build stays backend-free and never ships a
line of Studio code or a single judgment.

## Reviewing at multiple scales

A lens selects the granularity of the feed. Each level supports a different kind of
judgment.

| lens | one card is… | what it tests |
| --- | --- | --- |
| **Day** | a whole-day concept: theme, six reveal words, resonance threads | coherence, resonance, narrative force |
| **Facet** | one facet's title and body | whether the unit earns its place |
| **Line** | a reveal word, a title, or a single sentence | clarity, rhythm, copy quality, factual claims |

Switch lenses with the buttons or `g`. Filter to unpublished content to review the
raw AI abundance before it reaches the reader.

## Capturing a judgment

Every card takes the same fast input:

- **Verdict** (`1`–`4`): **Keep** (alive, belongs), **Flat** (lifeless), **Fix**
  (worth keeping, needs work), **Cut** (reject).
- **Tags** (optional): `resonance`, `coherence`, `voice`, `clarity`, `rhythm`,
  `cliché`, `source`, `copy`. These name *what kind* of judgment it is so the report
  can aggregate them.
- **Note** (optional): a sentence in your own words.

Keys: `j`/`k` move, `1`–`4` record a verdict and advance, `g` cycles the lens, `u`
undoes the focused card's last judgment. Re-judging a span overrides the previous
verdict; the log keeps the history.

## The ledger

Judgments are appended to `content/judgments.jsonl`, one per line, tracked in git so
the signal is durable and reviewable. A judgment records *what* was judged (a stable
target: day slug, level, facet, and the exact text), the verdict, tags, a note, and a
timestamp. The shape lives in [`src/content/judgments.ts`](src/content/judgments.ts)
and is mirrored by [`schema/judgments.schema.json`](schema/judgments.schema.json).

Because the target stores the exact text it judged, the report flags **stale**
judgments: a verdict captured before the underlying content was edited, so you know to
re-review it.

## From judgment to revision

`npm run studio:report` reads the ledger and the live content and prints:

- a **revision queue** (cut, then fix, then flat) with location, tags, excerpt, note;
- **trust risks**: every current `source` flag, the claims that need verification;
- verdict and tag signal counts, and a per-day rollup;
- **stale** judgments to re-review.

```
npm run studio:report -- --day 1    # focus one day
npm run studio:report -- --queue    # just the revision queue
```

This is the loop the vision asks for: instinctive reactions in the feed become a
small, prioritized list of edits that move the corpus from rough abundance toward a
curated, high-trust library worthy of Pantheon.

## Where it sits in the pipeline

The content pipeline (`map → scout → deep → validate → sync`) produces and guards
days. The Studio sits between `deep` (a day is drafted) and `validate`/publish (a day
is trusted): it is the human pass that decides whether the prose is alive and the
claims are safe before a day is promoted toward `published`.
