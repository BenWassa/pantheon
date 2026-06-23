# Pantheon Editorial Charter

*The standard every day of content is held to. When in doubt, this document wins.*

## What Pantheon is

Pantheon is a daily encounter with the fullest breadth of human experience. Each day presents one theme and six facets that illuminate it from different angles. The facets are not a list of good things. They rhyme. Together they should leave the reader having felt something true about being human, and having learned something they can carry.

The register spans the whole range. Triumph and shame, the sacred and the ruinous, the celebrated and the forgotten. Pantheon is not a comfort feed and not a museum of horrors. It is the honest middle: rich, serious, sometimes profound, sometimes nostalgic, always human.

## Who it is for

An educated, curious reader who is not a specialist. Someone who wants depth without jargon and profundity without pretension. Assume intelligence. Do not assume prior knowledge. Never condescend, never show off.

## The daily unit

One theme. Six fixed facets, always in this order:

- **Person**: a single human life that embodies the theme, shown with its highs and its lows. Real and documented, not a hagiography.
- **Picture**: a single visual work (painting, photograph, artifact). The body teaches the reader how to look at it. Carries an image reference, attribution, and license.
- **Poem**: a single poem. Prefer public domain so it can be shown in full. For work still in copyright, discuss it and point to a licensed source rather than reproduce it.
- **Principle**: the idea at the theme's spine. A concept, a mental model, a way of seeing. The intellectual anchor of the day.
- **Passage**: a single passage of wisdom, sacred, or literary text, from any tradition. This is the broadened heir to "Psalm," and must range beyond any one faith over time.
- **Parallel**: the bridge from history to now. How the theme recurs in the present, ideally with a resonance that surprises.

Days are sequential (Day 1, 2, 3), not tied to the calendar. A missed day is not missed, the sequence simply waits. This keeps the library small and the reader free of guilt.

## The resonance rule (non-negotiable)

The six facets must rhyme. Each illuminates the same theme, and the cross-threads between them are the entire point. In the Hubris day, Auden's poem is about the Bruegel painting, and Qin's vanished empire is the same image as Ozymandias's ruin. That is not decoration. That is the product.

A day whose facets merely sit beside each other has failed, even if each facet is individually strong. Before a day ships, name the threads that connect the facets. If you cannot, the day is not ready.

## Voice

- Calm, precise, evocative. Plain strong sentences.
- Show, do not lecture. Let the material carry the feeling. Do not instruct the reader to be moved.
- Around 80 to 130 words per facet body.
- Concrete over abstract. A detail the reader can see beats an adjective.
- No em dashes. Use commas, colons, and periods.
- No cliche standing in for insight. "Pride comes before a fall" is a starting point, not a thought.
- Earn every note of awe. Understatement is stronger than superlative.
- A facet is a shape, not a list of facts. It carries one controlling idea, turns on a hinge, and lands its last line. A body that recites true things in the order they happened has failed even when every claim is sourced.

The Hubris day is the calibration sample. A new draft should feel like it belongs beside it.

How to give a facet that shape, and the per-type craft (each of the six wants a
different shape: Person an arc, Picture guided looking, Parallel a late
surprise, and so on), lives in the [`facet-authoring` skill](.claude/skills/facet-authoring/SKILL.md).
Reach for it when writing a new body or revising a flat one.

## The credibility bar

Pantheon's only real asset is trust. One confident wrong fact spends it.

- Every claim rests on a primary or authoritative secondary source, recorded in the facet's `sources`.
- Anchor every entity to its Wikidata QID where one exists.
- Distinguish legend from fact in the prose itself. Qin is "thought to have" swallowed mercury, not "did."
- Where accounts conflict, flag the conflict. Do not smooth it into false certainty.
- Never invent an attribution or a source. If it cannot be verified, it does not run.

## Balance and coverage

The library must grow toward breadth, not drift toward a house style of one mood and one hemisphere.

- **Register**: track it per day. Elegy is one register. So are redemption, defiance, tenderness, comedy, and awe. Hubris-without-redemption was a deliberate single register, and redemption deserves its own days. Do not let the library become uniformly tragic.
- **Region and era**: tagged with a controlled vocabulary (see data-model). Pull deliberately toward the non-Western and the non-modern. Four Mediterranean facets in one day is a flag, not a default.
- The map of coverage is queried, not remembered. Gaps drive what gets researched next.

## The taste rule

Avoid the greatest hits as reflexes. Icarus, Napoleon, Ozymandias, and Theranos are where a tired search lands first. They are allowed only when they are genuinely the best choice, never as the path of least resistance. Prefer the lesser-known but rigorously documented. Surprise is a value here.

## Images and licensing

Public domain or Creative Commons only, sourced from Wikimedia Commons or an equivalent. Store the image reference, attribution, and license in the data. Never ship art Pantheon has no right to show.

## What a failed facet looks like

- A Person that reads like a Wikipedia summary with no shape and no stakes.
- A Principle that is a platitude wearing a serious face.
- A Parallel that has to be forced to fit.
- A facet that breaks the day's resonance.
- Any claim without a source.
- Em dashes.
