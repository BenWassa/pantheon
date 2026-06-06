# Pantheon Product Requirements (Trial)

*A lean PRD for a personal trial. Not a launch spec.*

## Product

Pantheon. A personal daily-learning app. One theme a day, six resonant facets, explored at the reader's pace.

## Why

A daily, credible, profound encounter with the breadth of human experience. An antidote to shallow feeds, built by and for one reader. The goal is depth and delight, not reach.

## Core experience

- Open the app. Today's theme appears as six words, one per facet, on a dark field.
- Each facet is hidden until tapped. Tapping opens the Person, Picture, Poem, Principle, Passage, or Parallel. Hidden-until-tapped turns a small library into discovery.
- One new theme unlocks per calendar day, on first visit. The reader can revisit today's facets freely.
- Days are sequential, not dated. Miss a day and the sequence waits. No streak guilt.

## Facets

The six fixed facets and their standards are defined in the Editorial Charter. The app renders them in fixed order: Person, Picture, Poem, Principle, Passage, Parallel.

## Scope (trial v1)

- Local-first, single user, no accounts, no backend.
- Content library ships as JSON, lazy-loaded one day at a time.
- Mobile-first. Installable (PWA) is a nice-to-have, not required for v1.
- Dark, restrained, typographic aesthetic. The Nocturnal Index direction.

The content pipeline (Map, Scout, Deep) produces the library. It is separate from the app runtime. The app only reads finished JSON.

## Non-goals

- No marketing, no growth, no virality. Pantheon is not trying to trend.
- No multi-user, no auth, no social features.
- No monetization.
- No algorithmic feed. The sequence is the design.

## Success criteria

Primary, measured over a 30-day trial window starting from first daily use:

- **Open rate at least 60% of days.** Floor. Below this, the concept is not earning its slot.
- **Open rate at least 90% of days.** Target. At this level the habit has formed and the trial is a success.

Secondary, qualitative: at the end of the window it feels worth keeping, and the reader looks forward to the next theme.

(30 days is the first checkpoint. Extend the window if the signal is promising but incomplete.)

## Tech

- React + Vite + TypeScript + Tailwind + Zustand.
- Local-first. JSON content, lazy-loaded per day. Full JSON portability.
- Persisted state: current day index, per-day open record (for the metric), and per-facet read state.

## Content model

Defined in data-model.md. In brief: days as JSON files, an entity ledger for dedupe and graph nodes, slug plus Wikidata QID identity, a status lifecycle, and a controlled tag vocabulary for register, region, and era.

## Open decisions

- graphify: which tool, and its expected edge format.
- Notifications: a single daily nudge, or nothing. Leaning toward nothing for the trial, to keep it pull not push.
- Day-advance edge cases: which timezone defines a "calendar day," and behavior across long gaps.
- The exact reveal interaction: grid, deck, or constellation. Grid is the current default.
