# Mobile Studio — UX assessment & user flow

_A design pass on the mobile review surface (`/mobile-studio.html`,
`src/mobile-studio/`). The goal: a serious, professional reading-and-judging
experience — text-heavy in the Instagram mould, seamless to move through, hard to
break — and a way to get your decisions back out._

This document maps the typical user flow, walks it against concrete test cases, and
records the assessment behind the changes so the next pass has a baseline.

---

## The user, and what they came to do

One person, on a phone, reviewing draft days. They are not filling in a form; they
are **reading prose and reacting to it** — the same taste-work the desktop Studio
captures with a keyboard, but done in bed or on a train with a thumb. Every design
choice serves that: reading must be effortless, a verdict must be one tap, and
moving on must be a reflex, not a hunt.

## The typical flow

1. **Open.** The studio loads the newest day and drops you on its first facet
   (Person). A floating header names the day and shows six dots — one per facet.
2. **Read.** The facet is a single scrolling column: an editorial hero (image +
   reveal word) at the top, then the title and body in a comfortable reading
   measure. You scroll down to read; the hero slides away and the prose owns the
   screen.
3. **Judge.** A floating pill sits at the bottom: **Keep · Flat · Fix · Cut**, plus
   **Note**. One tap records a verdict (with a haptic tick and a pop) and, after a
   beat, advances to the next facet. Tapping **Note** opens a sheet for tags,
   severity, and a suggested rewrite.
4. **Move.** Swipe **left** for the next facet, **right** for the previous — from
   anywhere in the text, mid-read, without hunting for a scroll edge. The dots and
   the day arrows are the explicit alternative. At the sixth facet, forward rolls
   into the next day.
5. **Judge the whole day.** Tapping the theme in the header opens the same sheet
   targeted at the day concept (coherence, resonance).
6. **Export.** Tapping the mode chip opens the sync sheet. You export your
   decisions as a readable **`.md` summary** (for you) and/or the **`.jsonl`** the
   revision report ingests (append to `content/judgments.jsonl`). In live mode the
   ledger already has them; the export is still there for a copy.

## Interaction model (the one-line contract)

| Axis | Gesture | Result |
| --- | --- | --- |
| Vertical | scroll / flick | **Reading.** Always native, never intercepted. |
| Horizontal | swipe left / right | **Navigate** next / previous facet. |
| Tap | verdict pill | Record a verdict, advance. |
| Tap | dot / arrow / theme | Jump to a facet / day / the whole-day judgment. |
| Tap | mode chip | Open export & sync. |

The rule the reviewer can hold in their head: **scroll to read, swipe sideways to
move, tap to judge.** Reading and navigation are on different axes, so they never
fight.

---

## Test cases

Walked against the flow above. "Pass" = behaves as the contract promises.

| # | Scenario | Expected | Result |
| --- | --- | --- | --- |
| 1 | Read a long facet, then swipe left mid-paragraph | Advances to next facet without reaching the scroll bottom | **Pass** — horizontal nav is decoupled from scroll position |
| 2 | Flick vertically to read fast | Native momentum scroll, no page turn | **Pass** — vertical is never intercepted (`touch-pan-y`) |
| 3 | Swipe right on the very first facet of the first day | Rubber-bands and springs back; no blank screen | **Pass** — end-of-deck resistance, no commit when nothing there |
| 4 | Swipe left on the last facet of the last day | Rubber-bands back | **Pass** — same guard on the far end |
| 5 | Diagonal / ambiguous drag | Axis locks to the dominant direction once, then stays | **Pass** — single-decision axis lock |
| 6 | Tap Keep, then immediately tap Cut (correction) | Records **Cut**, advances **once** | **Pass** — auto-advance is debounced |
| 7 | Fast double horizontal swipe | One page turn, deck never tears | **Pass** — navigation locks during the ~150 ms transition |
| 8 | Facet with a broken / placeholder image | Clean dark title plate, no raw alt text over the header, no dead "View" chip | **Pass** — image-error guardrail |
| 9 | Facet with no image at all | Typographic hero (label + reveal word) in-column; no empty gap | **Pass** — no-image layout path |
| 10 | Multi-paragraph body | Renders as separated paragraphs, not one dense block | **Pass** — body split on blank/newlines |
| 11 | Open Note sheet with the soft keyboard up | Sheet stays above the keyboard | **Pass** — `visualViewport` offset (pre-existing, retained) |
| 12 | Reduced-motion enabled | Enter / pop / sheet animations disabled | **Pass** — `prefers-reduced-motion` honoured |
| 13 | Export with zero decisions | Buttons disabled; summary export never throws | **Pass** — empty-state guarded |
| 14 | Re-judge a facet, then export summary | Summary shows the **latest** verdict only | **Pass** — `latestByTarget` collapse |
| 15 | Webfonts blocked / offline | Falls back to system serif, layout intact | **Pass** — graceful fallback; fonts now actually requested |

---

## Before → after

### 1. Sloppy swipe and scroll
- **Was:** vertical paging gated on hitting the exact scroll edge. On iOS the edge
  is slippery (momentum overshoot), so page turns fired late, early, or not at all.
  Horizontal swipes did nothing. The card popped in via a keyframe with no
  continuity to the gesture.
- **Now:** an Instagram-carousel model. Horizontal swipe navigates and is available
  from anywhere in the text; vertical is pure native reading scroll. The card
  follows the finger, rubber-bands at the ends of the deck, and the incoming card
  slides in from the matching side. A double-swipe can't tear it (transition lock).

### 2. Text and image layout
- **Was:** a cropped 22 dvh hero that scrolled away, the huge reveal word jammed
  directly beneath it, a single dense body block, and — the silent killer — **the
  brand serifs never loaded on mobile** (the page only `preconnect`ed to Google
  Fonts and never requested the stylesheet), so everything fell back to system
  serif.
- **Now:** a tall editorial hero with the facet label and reveal word set over its
  lower third (magazine-style), a clear title → hairline → body rhythm, a
  comfortable reading measure and larger body type, real paragraph spacing, and the
  Fraunces / Newsreader stylesheet actually loaded.

### 3. Not seamless / not Instagram-like
- **Was:** vertical pop transitions, navigation coupled to reading.
- **Now:** gesture-tracked horizontal turns on their own axis, short eased entrances
  matching the swipe direction, reading never interrupted by an accidental turn.

### 4. Export for decisions and choices
- **Was:** reachable only via the local chip; unavailable in live mode; JSONL only —
  no human-readable record of what you decided.
- **Now:** the mode chip opens the sync sheet in **both** modes. Two clearly labelled
  groups: **Your decisions** (a readable `.md` summary + Share) and **For the
  ledger** (`.jsonl` download + copy). The summary groups the current verdict per
  day and facet with its note, tags, and any suggested rewrite.

## Guardrails against breaking

- **Axis lock** — a gesture is decided once and never flips between read and
  navigate mid-drag.
- **End-of-deck resistance** — swiping past the first/last card rubber-bands and
  never commits, so you can't land on a blank screen.
- **Transition lock** — new gestures are ignored while a page turn animates; a
  frantic double-swipe turns exactly one page.
- **Debounced auto-advance** — a quick verdict correction records the last choice
  and advances once, instead of skipping a card.
- **Broken-image degradation** — a failed hero collapses to a clean dark plate
  instead of dumping alt text over the header.
- **Reduced motion** — every animation is disabled when the OS asks for stillness.
- **Optimistic writes with rollback** — a verdict that fails to save is removed and
  surfaced as a toast (pre-existing, retained).

## Holistic review against the flow

Re-reading the whole against the six-step flow:

- **Open → Read** is now the strong part: fonts load, the hero has presence, and the
  body reads like a reading app, not a form. ✓
- **Judge** is unchanged in spirit (one tap) but safer against fat-finger
  corrections. ✓
- **Move** is the biggest win: the swipe is predictable and reading-safe, and the
  dots/arrows remain for anyone who prefers explicit controls. ✓
- **Whole-day judgment** and **Note** are untouched and still coherent with the new
  layout. ✓
- **Export** now closes the loop the brief asked for: a decision made on the phone
  can leave the phone, both as a readable record and as pipeline-ready JSONL. ✓

### Known limits / next pass
- The incoming card animates in after the outgoing one exits rather than being
  dragged in alongside it; truly rendering the neighbour under the finger would make
  the turn feel continuous end-to-end. A deliberate next step, not a regression.
- There is no visible "swipe to move" hint on first run; a one-time coach mark could
  help a brand-new reviewer discover horizontal navigation.
- A facet with a broken image shows a bare dark plate; a subtle texture or the
  reveal word centred could make that state feel more composed.
