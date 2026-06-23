---
name: facet-authoring
description: Author or revise a Pantheon facet body so it reads as shaped narrative, not a list of facts. Use when writing, rewriting, or reviewing the prose of any facet (Person, Picture, Poem, Principle, Passage, Parallel), when filling a deep.ts scaffold, or when working the Studio revision queue.
---

# Facet authoring

The job is not to report true things about a subject. It is to arrange them
into a **shape** that lands. A facet that lists facts in the order they
happened has failed even when every fact is sourced and the word count is
right. This skill is how Pantheon prose gets written and how weak prose gets
fixed. It sits under the [editorial charter](../../../editorial-charter.md);
the charter wins on any conflict.

## The failure this fixes

The flat facet reads as an inventory: clause after clause joined by *and* and
*then*, each there only because it is true. There is no tension, no turn, no
line the reader carries out. The original Hubris Person body was the canonical
example:

> He unified the warring states into the first Chinese empire in 221 BCE, then
> standardized the script, the coinage, even the axle width of carts... He also
> buried scholars... Terrified of dying, he sent expeditions... He died on tour
> in 210 BCE. Within four years the dynasty... had fallen. His tomb... lay
> forgotten until farmers struck it...

Every fact survives in the rewrite. What changed is the **shape**: a man who
bent a whole civilization to one will, met the one thing that would not obey
(death), grasped at it, and left an empire that outlived him by four years and
a buried army found by accident. Same facts, given an arc and a landing.

## Universal craft (every facet)

1. **One controlling idea.** Before writing, name in a sentence the single
   thing this facet is *about*. Not the subject (Qin), the idea (a man who
   could command everything except his own death). If you cannot name it, you
   are not ready to write. Cut anything that does not serve it.
2. **A shape, not a list.** Setup, then a **turn**, then a landing. There must
   be one hinge sentence where the meaning pivots. Prose that is all flat
   declaratives joined by *and*/*then* has no hinge.
3. **Open on a stake or an image, not a definition or a date.** The first
   sentence earns the next one. Birth dates, dictionary openings, and "X was a
   Y who..." are dead starts.
4. **Subordinate facts to the trajectory.** Achievements are not a list to
   recite; they are altitude the fall needs, or evidence the turn requires.
   Make each fact do work for the shape or cut it.
5. **Land the last sentence.** The closing line is the one the reader carries.
   Earn it with a concrete image or a turned idea; never trail off into one
   more fact.
6. **Concrete over abstract.** One thing the reader can see (the axle width of
   carts, a well dug in 1974) beats three adjectives.
7. **Serve the resonance.** Each facet is one voice in a chord. Bend the body
   so the day's threads are *felt* in the prose, not only asserted in
   `resonanceThreads`. Name the thread you are serving before you write.

## Native shapes per facet type

The six are not interchangeable. Each has a shape it wants.

- **Person — narrative arc (the strongest story).** A life, not a CV. Pick the
  arc deliberately: rise-and-fall, the one decisive choice, the long defeat,
  the late vindication. Open in a stake or a scene. Build to the turn. End on
  the human, not the footnote. Highs *and* lows, real and documented, never
  hagiography. This is the type that most rewards story structure, and the one
  that most often fails as a Wikipedia summary.

- **Picture — guided looking (spatial, second person).** Teach the eye where
  to move: start wide, direct the gaze to the detail that carries the meaning,
  then name what the composition is *doing*. The arc is perceptual (what you
  see first, what you missed, what it means), not chronological. End on the
  picture's argument. The Hubris *Icarus* body is the model.

- **Poem — the bridge.** Do not paraphrase the poem. Situate it against the
  theme and usually the day's picture or person: say what the poem *does* that
  the image only shows. Public domain, let a real line breathe. In copyright,
  characterize and point to a licensed source, never reproduce. Land on the
  poem's claim.

- **Principle — the idea made vivid.** Do not define and stop. Move from the
  concept to the pattern the reader will now recognize in the world.
  Distinguish the real idea from its cliché ("hubris was not ordinary pride").
  The turn is from abstraction to *you have seen this*. End on the idea
  sharpened, not softened into a platitude.

- **Passage — wisdom in plain images.** Frame briefly, then let the source's
  own images carry it (the overfilled cup, the over-ground blade), then close
  the loop back to the day. Restraint: do not gloss every line. Honor the
  tradition, and across the library range beyond any one faith.

- **Parallel — the surprising recurrence.** The payoff is the click of
  recognition: the old pattern in modern dress. Set the modern case up on its
  own terms first; let the rhyme with the day land *late*, not in sentence one.
  The surprise must be earned, never forced. A parallel that has to be bent to
  fit is a cut, not a fix.

## Revision protocol

For a facet that already exists (a Studio `fix`/`flat` verdict, a rewrite
pass), work these in order. Do not start rewriting until step 1 is answered.

1. **Name the controlling idea.** If you cannot, that absence is the problem;
   find it before touching prose.
2. **Find the hinge.** Is there a sentence where the meaning turns? If it is
   all flat declaratives joined by *and*/*then*, there is no shape to fix, only
   a shape to build.
3. **Test the opening.** Stake or image, or definition or date? Rewrite dead
   starts.
4. **Test the ending.** Does the last sentence land, or is it just the last
   fact? Move the strongest image to the close.
5. **Cut the inventory.** Any sentence present only because it is true, not
   because the shape needs it, is a candidate to cut.
6. **Check the thread.** Does the body make the day's resonance felt?
7. **Re-run the constraints** (below).

Maps onto Studio tags: `voice`, `rhythm`, `clarity`, `cliché`, `copy` are this
protocol; `source` is the trust gate, handled separately and never traded
against prose quality.

## Constraints (the gate will enforce these)

- 80 to 130 words per body. `npm run validate` counts and fails outside it.
- No em dash. Use commas, colons, periods. (En dash warns.)
- Every claim rests on a source in `sources`. Never invent one.
- Mark legend as legend ("is thought to have," not "did") where accounts are
  uncertain or conflict.
- No cliché standing in for a thought. No greatest-hits subject as a reflex.
- After editing content files, run `npm run validate` (and `npm test` for the
  content gate). For ledger/usage drift, `npm run sync`.

When done, the facet should be able to stand beside the rewritten Hubris day
and feel like it belongs.
