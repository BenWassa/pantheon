// Pure report logic for the Studio: turn the current (latest-per-target) judgments
// into the orderings and rollups the revision queue needs. Kept separate from
// scripts/studio-report.ts (which does I/O and printing) so the ordering rules are
// unit-testable without touching the disk or the live content.

import type { Judgment, JudgmentLevel, JudgmentTarget, Verdict } from '@/content/judgments';
import { JUDGMENT_LEVELS, SEVERITY_WEIGHT, targetId } from '@/content/judgments';

// A judgment's severity weight, treating an unrated negative as 0 so rated items
// of the same verdict rank ahead of unrated ones.
function severityWeight(j: Judgment): number {
  return j.severity ? SEVERITY_WEIGHT[j.severity] : 0;
}

// ---- Revision queue ---------------------------------------------------------

// The order the queue surfaces problems in: hardest rejection first.
export const QUEUE_ORDER: readonly Verdict[] = ['cut', 'fix', 'flat'] as const;

// How much each verdict counts as a "negative signal" when ranking days/facets.
// keep is zero: a kept span is not a problem to triage.
export const NEGATIVE_WEIGHT: Record<Verdict, number> = { cut: 3, fix: 2, flat: 1, keep: 0 };

// Build the revision queue: cut, then fix, then flat; within a verdict, by
// severity (major before minor before unrated), then by day, then by facet, then
// by sentence position, so the most damaging items surface first and a day still
// reads top to bottom.
export function revisionQueue(current: Judgment[]): Judgment[] {
  return current
    .filter((j) => QUEUE_ORDER.includes(j.verdict))
    .sort(
      (a, b) =>
        QUEUE_ORDER.indexOf(a.verdict) - QUEUE_ORDER.indexOf(b.verdict) ||
        severityWeight(b) - severityWeight(a) ||
        a.target.day - b.target.day ||
        (a.target.facet ?? '').localeCompare(b.target.facet ?? '') ||
        (a.target.sentenceIndex ?? -1) - (b.target.sentenceIndex ?? -1),
    );
}

// ---- Staleness --------------------------------------------------------------

// Resolves the text a target points at in the *current* content. Injected so the
// pure logic never imports the day loader; the CLI passes a real resolver.
export type TextResolver = (t: JudgmentTarget) => string | undefined;

// A judgment is stale when it recorded the exact text it judged and that text no
// longer matches what the content says now: the span was edited after judging.
export function isStale(j: Judgment, resolve: TextResolver): boolean {
  if (j.target.text === undefined) return false;
  const live = resolve(j.target);
  return live !== undefined && live !== j.target.text;
}

export function staleJudgments(current: Judgment[], resolve: TextResolver): Judgment[] {
  return current.filter((j) => isStale(j, resolve));
}

// ---- Review coverage -------------------------------------------------------

export interface ReviewTarget {
  id?: string;
  target: JudgmentTarget;
}

export interface CoverageRow {
  label: string;
  total: number;
  reviewed: number;
  unreviewed: number;
  percent: number;
}

export function coverageForTargets(
  label: string,
  targets: ReviewTarget[],
  current: Judgment[],
): CoverageRow {
  const reviewedIds = new Set(current.map((j) => targetId(j.target)));
  const reviewed = targets.filter((t) => reviewedIds.has(t.id ?? targetId(t.target))).length;
  const total = targets.length;
  return {
    label,
    total,
    reviewed,
    unreviewed: total - reviewed,
    percent: total === 0 ? 0 : Math.round((reviewed / total) * 100),
  };
}

export function unreviewedTargets(
  targets: ReviewTarget[],
  current: Judgment[],
  limit?: number,
): ReviewTarget[] {
  const reviewedIds = new Set(current.map((j) => targetId(j.target)));
  const gaps = targets.filter((t) => !reviewedIds.has(t.id ?? targetId(t.target)));
  return limit === undefined ? gaps : gaps.slice(0, limit);
}

// ---- Per-level rollup -------------------------------------------------------

function zeroVerdicts(): Record<Verdict, number> {
  return { keep: 0, flat: 0, fix: 0, cut: 0 };
}

export interface LevelRow {
  level: JudgmentLevel;
  total: number;
  byVerdict: Record<Verdict, number>;
}

// Verdict counts grouped by review level (day, facet, title, oneWord, sentence),
// in the canonical level order. Only levels with at least one judgment are returned.
export function byLevel(current: Judgment[]): LevelRow[] {
  const map = new Map<JudgmentLevel, LevelRow>();
  for (const j of current) {
    const level = j.target.level;
    const row = map.get(level) ?? { level, total: 0, byVerdict: zeroVerdicts() };
    row.total += 1;
    row.byVerdict[j.verdict] += 1;
    map.set(level, row);
  }
  return JUDGMENT_LEVELS.filter((l) => map.has(l)).map((l) => map.get(l)!);
}

// ---- Strongest keeps --------------------------------------------------------

const LEVEL_RANK: Record<JudgmentLevel, number> = {
  day: 0,
  facet: 1,
  title: 2,
  oneWord: 3,
  sentence: 4,
};

// The clearest "keep" signals worth holding onto: keep verdicts, larger units
// first (a kept whole day says more than a kept sentence), then by day.
export function strongestKeeps(current: Judgment[], limit?: number): Judgment[] {
  const keeps = current
    .filter((j) => j.verdict === 'keep')
    .sort(
      (a, b) =>
        LEVEL_RANK[a.target.level] - LEVEL_RANK[b.target.level] || a.target.day - b.target.day,
    );
  return limit === undefined ? keeps : keeps.slice(0, limit);
}

// ---- Worst days / facets by negative signal ---------------------------------

export interface NegativeRow {
  key: string; // slug for days; "slug · facet" for facets
  slug: string;
  day: number;
  facet?: string; // facet key, present on facet rows only
  total: number; // judgments counted
  byVerdict: Record<Verdict, number>;
  negative: number; // weighted negative score
}

function accumulate(
  current: Judgment[],
  keyOf: (j: Judgment) => string | undefined,
  rowOf: (j: Judgment) => Omit<NegativeRow, 'total' | 'byVerdict' | 'negative'>,
): NegativeRow[] {
  const map = new Map<string, NegativeRow>();
  for (const j of current) {
    const key = keyOf(j);
    if (key === undefined) continue;
    const row = map.get(key) ?? { ...rowOf(j), total: 0, byVerdict: zeroVerdicts(), negative: 0 };
    row.total += 1;
    row.byVerdict[j.verdict] += 1;
    row.negative += NEGATIVE_WEIGHT[j.verdict];
    map.set(key, row);
  }
  // Most negative first; ties broken by day for stable output.
  return [...map.values()].sort((a, b) => b.negative - a.negative || a.day - b.day);
}

// Days ranked by total negative signal (cut/fix/flat weighted), worst first.
export function worstDays(current: Judgment[]): NegativeRow[] {
  return accumulate(
    current,
    (j) => j.target.slug,
    (j) => ({ key: j.target.slug, slug: j.target.slug, day: j.target.day }),
  ).filter((r) => r.negative > 0);
}

// Facets ranked by total negative signal, worst first. Only judgments that name a
// facet are counted (day-level judgments are excluded).
export function worstFacets(current: Judgment[]): NegativeRow[] {
  return accumulate(
    current,
    (j) => (j.target.facet ? `${j.target.slug}::${j.target.facet}` : undefined),
    (j) => ({
      key: `${j.target.slug} · ${j.target.facet}`,
      slug: j.target.slug,
      day: j.target.day,
      facet: j.target.facet,
    }),
  ).filter((r) => r.negative > 0);
}
