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
raw AI abundance before it reaches the reader. Use **Needs review** when you want the
feed to hide anything that already has a current judgment in the selected lens.

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

- **promotion readiness**: whether the scope still has unjudged day/facet cards,
  unresolved negative verdicts, source flags, or stale judgments;
- **review coverage** by lens, so you can see how much day, facet, and line judgment
  signal exists;
- the **next judgment gaps**, pointing you to the next unreviewed cards before you
  revise;
- a **revision queue** (cut, then fix, then flat; then by day, facet, sentence) with
  location, tags, excerpt, and note;
- **trust risks**: every current `source` flag, the claims that need verification,
  with the reviewer's note;
- **verdict** counts and **tag** counts (most-used first);
- a **by-level** summary (day / facet / title / reveal word / sentence), so you can see
  which scale you have actually reviewed;
- a **per-day** rollup;
- the **weakest days** and **weakest facets**, ranked by a negative signal score
  (cut ×3, fix ×2, flat ×1), so the worst material rises to the top;
- the **strongest keeps**, the clearest "this is alive" signals worth protecting;
- **stale** judgments to re-review (the text changed after you judged it).

```
npm run studio:report -- --day 1    # focus one day
npm run studio:report -- --queue    # just the revision queue
```

This is the loop the vision asks for: instinctive reactions in the feed become a
small, prioritized list of edits that move the corpus from rough abundance toward a
curated, high-trust library worthy of Pantheon.

When you act on the queue, revise with the [`facet-authoring` skill](.claude/skills/facet-authoring/SKILL.md).
Its revision protocol turns a `fix`/`flat` verdict (and the `voice`, `rhythm`,
`clarity`, `cliché`, `copy` tags) into concrete moves: name the controlling idea,
find the hinge, fix the opening and the landing, cut the inventory. `source` flags
stay on the trust list and are never traded against prose quality.

## Where it sits in the pipeline

The content pipeline (`map → scout → deep → validate → sync`) produces and guards
days. The Studio sits between `deep` (a day is drafted) and `validate`/publish (a day
is trusted): it is the human pass that decides whether the prose is alive and the
claims are safe before a day is promoted toward `published`.

## The seed corpus

The repo ships one published calibration day (Hubris) plus six **draft** days seeded
specifically for Studio testing: Vastness, Mercy, Exile, Defiance, Comedy, and Repair.
They are deliberately uneven. Vastness and Repair are meant to read as strong, tightly
resonant days; Mercy, Exile, and Comedy each carry intentionally flat prose, weak reveal
words, forced parallels, and sentences that should probably be cut. Several facets carry
**source-risk** notes (an unverified statistic, a vague attribution, quoted in-copyright
lyrics, placeholder images). Every seed day's `notes` field says what is wrong with it on
purpose.

These days are **draft**, never `published`. They are not researched to charter standard,
their pictures are placeholders, and their poem rights are unverified. They exist to give
the review loop something real to chew on, not to ship. The default reader build
(`npm run build`) includes only `published` days, so none of this seed content reaches a
reader.

## First testing session

A concrete script for the first real human pass. Budget about 30–45 minutes.

1. `npm install`
2. `npm run validate` — confirms the corpus passes the trust gate (expect 0 errors).
3. `npm test` — confirms the Studio logic is green.
4. `npm run studio` — opens the feed against the dev server.
5. **Review 5–7 day cards** (Day lens). Ask: does the day cohere? Do the six reveal
   words sing together? Are the resonance threads real or forced? Verdict + tags
   (`resonance`, `coherence`), one-line note.
6. **Review 20–40 facet cards** (Facet lens, press `g`). Ask: does this facet earn its
   place? Is the prose alive or lifeless? Use `voice`, `cliché`, `source` freely.
7. **Review 50–100 line cards** (Line lens). Reveal words, titles, single sentences.
   This is where copy quality and factual claims surface. Use `copy`, `rhythm`,
   `clarity`, `source`.
8. **Tag aggressively.** The tags are the report's raw material: `source` becomes the
   trust-risk list, `cliché`/`voice` reveal voice problems, `copy`/`rhythm` flag
   word-level work. A verdict with no tag is a weaker signal.
9. `npm run studio:report` — turn the session into a revision queue.
10. **Read the report top-down.** Start with promotion readiness and review coverage:
    if the report still names unjudged day or facet cards, go back to Studio and use
    **Needs review**. Then work the revision queue (cut first, then fix, then flat).
    The trust-risk list is what to verify or cut before anything is promoted. The
    weakest-days/weakest-facets tables tell you where the rot is concentrated; the
    strongest-keeps list tells you what to protect. Stale entries mean re-review.

What "done" looks like for this first pass: roughly 75–150 judgments in the ledger, a
revision queue that names specific sentences and facets to cut or fix, and a clear sense
of which two or three draft days are worth carrying forward versus rebuilding.

### What is still weak (for after the first session)

- Verdicts and tags are captured per span, but there is no in-Studio diff view yet: when
  a span goes stale, the report tells you *that* it changed, not *how*.
- Promotion readiness is advisory. It tells you what is missing, but it does not yet
  block a status change in content JSON.
- The seed pictures are placeholders and the poems use pointer stubs; sourcing real,
  licensed images and confirmed poem rights is the obvious next content pass.
- The report ranks by a fixed negative-signal weighting; once you have real data you may
  want to tune those weights or filter by tag.
