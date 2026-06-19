// Pantheon Studio: the human-judgment model.
//
// The Studio is a private review layer. It does not change what the reader app
// ships; it captures instinctive reactions to AI-generated content and turns them
// into durable signals that drive revision. This module is the single source of
// truth for the judgment shape, shared by the Studio UI (src/studio) and the
// content pipeline (scripts/studio-report.ts). The JSON Schema under
// /schema/judgments.schema.json mirrors it.

import type { FacetKey } from './types';

// ---- Levels ----------------------------------------------------------------

// The scales the Studio reviews, from the whole-day concept down to a single
// reveal word. Each level tests a different kind of judgment: large units test
// coherence and resonance; small units test clarity, rhythm, and copy quality.
export type JudgmentLevel =
  | 'day' // the whole day: coherence, resonance, narrative force
  | 'facet' // one facet as a unit
  | 'title' // a facet's revealed heading
  | 'oneWord' // the day-specific hook shown on the dark grid
  | 'sentence'; // one sentence of a facet body: clarity, rhythm, claims, copy

export const JUDGMENT_LEVELS: readonly JudgmentLevel[] = [
  'day',
  'facet',
  'title',
  'oneWord',
  'sentence',
] as const;

export const LEVEL_LABELS: Record<JudgmentLevel, string> = {
  day: 'Day',
  facet: 'Facet',
  title: 'Title',
  oneWord: 'Reveal word',
  sentence: 'Sentence',
};

// ---- Verdicts --------------------------------------------------------------

// The instinctive reaction, turned into a signal. Four is enough to be fast.
export type Verdict =
  | 'keep' // alive, belongs, trustworthy, reads well
  | 'flat' // not wrong, just lifeless
  | 'fix' // worth keeping but needs work
  | 'cut'; // reject

export const VERDICTS: readonly Verdict[] = ['keep', 'flat', 'fix', 'cut'] as const;

export const VERDICT_LABELS: Record<Verdict, string> = {
  keep: 'Keep',
  flat: 'Flat',
  fix: 'Fix',
  cut: 'Cut',
};

// The 1-4 hotkeys the Studio binds, in verdict order.
export const VERDICT_KEYS: Record<string, Verdict> = {
  '1': 'keep',
  '2': 'flat',
  '3': 'fix',
  '4': 'cut',
};

// ---- Severity --------------------------------------------------------------

// How badly a negative verdict needs attention. Only meaningful for flat/fix/cut
// (a kept span has nothing to triage); optional, so a fast reviewer can skip it.
// It refines the revision queue: within a verdict, majors surface before minors.
export type Severity = 'minor' | 'major';

export const SEVERITIES: readonly Severity[] = ['minor', 'major'] as const;

export const SEVERITY_LABELS: Record<Severity, string> = {
  minor: 'minor',
  major: 'major',
};

// Ordering weight for the revision queue: heavier sorts first. Absent severity
// counts as 0, so an unrated negative falls below a rated one of the same verdict.
export const SEVERITY_WEIGHT: Record<Severity, number> = { major: 2, minor: 1 };

// ---- Tags ------------------------------------------------------------------

// Optional signal tags naming what kind of judgment this is. A controlled set so
// the report can aggregate them into a revision queue (e.g. every `source` flag
// is a trust risk; every `cliche` flag is a voice risk).
export type JudgmentTag =
  | 'resonance' // the cross-facet rhyme the charter makes non-negotiable
  | 'coherence' // holds together as one thing
  | 'voice' // sounds like Pantheon
  | 'clarity' // clear to an educated non-specialist
  | 'rhythm' // reads beautifully
  | 'cliche' // a tired phrase standing in for a thought
  | 'source' // factual safety: needs a source or verification
  | 'copy'; // word-level copy quality (titles, reveal words)

export const JUDGMENT_TAGS: readonly JudgmentTag[] = [
  'resonance',
  'coherence',
  'voice',
  'clarity',
  'rhythm',
  'cliche',
  'source',
  'copy',
] as const;

export const TAG_LABELS: Record<JudgmentTag, string> = {
  resonance: 'resonance',
  coherence: 'coherence',
  voice: 'voice',
  clarity: 'clarity',
  rhythm: 'rhythm',
  cliche: 'cliché',
  source: 'source',
  copy: 'copy',
};

// ---- The judgment record ---------------------------------------------------

// What a single judgment points at. `slug` is the stable reference because a day
// index can shift as the library is reordered; `text` records the exact span
// under judgment so a later edit to the content can be detected as staleness.
export interface JudgmentTarget {
  level: JudgmentLevel;
  day: number; // day index at capture time
  slug: string; // day slug: the stable key
  facet?: FacetKey; // present for facet / title / oneWord / sentence
  field?: string; // 'theme' | 'body' | 'title' | 'oneWord'
  sentenceIndex?: number; // position within a body, when level === 'sentence'
  text?: string; // the exact text judged
}

export interface Judgment {
  id: string;
  at: string; // ISO timestamp
  target: JudgmentTarget;
  verdict: Verdict;
  tags: JudgmentTag[];
  note?: string;
  severity?: Severity; // how badly a negative verdict needs work; orders the queue
  suggestion?: string; // the reviewer's proposed rewrite, carried into the report
}

// ---- Identity --------------------------------------------------------------

// A stable key for a target, independent of when it was judged. Re-judging the
// same span produces the same targetId, so `latestByTarget` can collapse the
// append-only log into the current verdict.
export function targetId(t: JudgmentTarget): string {
  return [t.slug, t.level, t.facet ?? '', t.field ?? '', t.sentenceIndex ?? ''].join('::');
}

// Sortable, collision-resistant id for a new judgment. `at` keeps the log
// chronological even when ids are generated in the same millisecond.
export function makeJudgmentId(now: number = Date.now(), rand: number = Math.random()): string {
  return `${now.toString(36)}-${Math.floor(rand * 1e9).toString(36)}`;
}

// ---- Sentence splitting ----------------------------------------------------

// Split a facet body into sentences for the finest review lens. The corpus voice
// is deliberately plain (no em dashes, few abbreviations), so a punctuation split
// is reliable; the merge step keeps initials like "W. H. Auden" and a few common
// abbreviations from being broken across cards.
const TRAILING_INITIAL_OR_ABBREV = /(?:^|\s)(?:[A-Z]|e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|St)\.$/;

export function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed === '') return [];

  // A boundary is terminal punctuation followed by whitespace or end of string.
  // "e.g." and "W." are not boundaries on their own: the "." is not followed by a
  // space, so the scan only breaks after a real sentence end.
  const pieces: string[] = [];
  const boundary = /[.!?]+(?:\s+|$)/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(trimmed)) !== null) {
    const end = m.index + m[0].length;
    pieces.push(trimmed.slice(start, end).trim());
    start = end;
  }
  if (start < trimmed.length) pieces.push(trimmed.slice(start).trim());

  // Re-join fragments that ended on an initial or abbreviation, not a sentence.
  const merged: string[] = [];
  for (const piece of pieces.filter(Boolean)) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && TRAILING_INITIAL_OR_ABBREV.test(prev)) {
      merged[merged.length - 1] = `${prev} ${piece}`;
    } else {
      merged.push(piece);
    }
  }
  return merged;
}

// ---- Aggregation -----------------------------------------------------------

// Collapse the append-only log to the most recent judgment per target. This is
// the "current opinion" view: the log keeps history, this keeps the verdict.
export function latestByTarget(judgments: Judgment[]): Map<string, Judgment> {
  const latest = new Map<string, Judgment>();
  for (const j of judgments) {
    const key = targetId(j.target);
    const existing = latest.get(key);
    if (!existing || j.at >= existing.at) latest.set(key, j);
  }
  return latest;
}

export interface JudgmentRollup {
  total: number; // judgments in the current view
  byVerdict: Record<Verdict, number>;
  byTag: Record<JudgmentTag, number>;
  bySeverity: Record<Severity, number>; // rated negatives, by how bad
  withSuggestion: number; // how many carry a proposed rewrite
  byDay: Map<string, { slug: string; day: number; byVerdict: Record<Verdict, number> }>;
}

function zeroVerdicts(): Record<Verdict, number> {
  return { keep: 0, flat: 0, fix: 0, cut: 0 };
}

function zeroSeverities(): Record<Severity, number> {
  return { minor: 0, major: 0 };
}

function zeroTags(): Record<JudgmentTag, number> {
  return {
    resonance: 0,
    coherence: 0,
    voice: 0,
    clarity: 0,
    rhythm: 0,
    cliche: 0,
    source: 0,
    copy: 0,
  };
}

// Roll up a set of judgments (typically the latest-per-target view) into the
// counts the report and the Studio header display.
export function rollup(judgments: Judgment[]): JudgmentRollup {
  const out: JudgmentRollup = {
    total: judgments.length,
    byVerdict: zeroVerdicts(),
    byTag: zeroTags(),
    bySeverity: zeroSeverities(),
    withSuggestion: 0,
    byDay: new Map(),
  };

  for (const j of judgments) {
    out.byVerdict[j.verdict] += 1;
    for (const tag of j.tags) out.byTag[tag] += 1;
    if (j.severity) out.bySeverity[j.severity] += 1;
    if (j.suggestion) out.withSuggestion += 1;

    const dayKey = j.target.slug;
    const day = out.byDay.get(dayKey) ?? {
      slug: j.target.slug,
      day: j.target.day,
      byVerdict: zeroVerdicts(),
    };
    day.byVerdict[j.verdict] += 1;
    out.byDay.set(dayKey, day);
  }

  return out;
}
