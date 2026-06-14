#!/usr/bin/env tsx
// Studio report: turn captured judgments into a revision queue.
//
// Reads the append-only judgment ledger (content/judgments.jsonl), collapses it to
// the current verdict per target, and prints what to act on: what to cut, what to
// fix, where trust is at risk (source flags), which days and facets are weakest, and
// where the content has been edited since it was judged (stale). This is the bridge
// from instinctive review back to improving the corpus.
//
// Usage:
//   npm run studio:report                 # full report
//   npm run studio:report -- --day 1      # focus one day
//   npm run studio:report -- --queue      # just the revision queue

import type { Day } from '@/content/types';
import {
  type Judgment,
  type JudgmentTarget,
  type Verdict,
  LEVEL_LABELS,
  TAG_LABELS,
  VERDICT_LABELS,
  latestByTarget,
  rollup,
  splitSentences,
} from '@/content/judgments';
import { loadDays } from './lib/content.ts';
import { readLedger } from './lib/judgmentsFile.ts';
import { LENSES, LENS_LABELS, buildFeed, type Lens } from '../src/studio/feed.ts';
import {
  byLevel,
  coverageForTargets,
  isStale,
  revisionQueue,
  staleJudgments,
  strongestKeeps,
  unreviewedTargets,
  worstDays,
  worstFacets,
} from './lib/report.ts';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

const dayFilter = flag('day') ? Number(flag('day')) : undefined;
const queueOnly = has('queue');

const dayBySlug = new Map<string, Day>(loadDays().map(({ day }) => [day.slug, day]));
const daysInScope = [...dayBySlug.values()]
  .filter((day) => dayFilter === undefined || day.index === dayFilter)
  .sort((a, b) => a.index - b.index);
const { judgments, malformed } = readLedger();

// The live text a target points at now, for staleness detection. Passed to the
// pure report helpers so they never import the day loader themselves.
function currentText(t: JudgmentTarget): string | undefined {
  const day = dayBySlug.get(t.slug);
  if (!day) return undefined;
  if (t.level === 'day') return day.theme;
  if (!t.facet) return undefined;
  const facet = day.facets[t.facet];
  if (!facet) return undefined;
  if (t.level === 'oneWord') return facet.oneWord;
  if (t.level === 'title' || t.level === 'facet') return facet.title;
  if (t.level === 'sentence' && t.sentenceIndex !== undefined)
    return splitSentences(facet.body)[t.sentenceIndex];
  return undefined;
}

function locate(t: JudgmentTarget): string {
  const base = `Day ${t.day} ${t.slug}`;
  const facet = t.facet ? ` · ${t.facet}` : '';
  const where =
    t.level === 'sentence' && t.sentenceIndex !== undefined
      ? ` · sentence ${t.sentenceIndex + 1}`
      : ` · ${LEVEL_LABELS[t.level].toLowerCase()}`;
  return base + facet + where;
}

function excerpt(text: string | undefined, max = 90): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

const inScope = (j: Judgment) => dayFilter === undefined || j.target.day === dayFilter;

const scoped = judgments.filter(inScope);
const current = [...latestByTarget(scoped).values()];
const totals = rollup(current);
const coverage = LENSES.map((lens) =>
  coverageForTargets(LENS_LABELS[lens], buildFeed(daysInScope, lens), current),
);

console.log('Pantheon Studio report');
console.log(dayFilter ? `Scope: day ${dayFilter}\n` : '');

if (judgments.length === 0) {
  console.log('No judgments recorded yet. Open the Studio (npm run studio) and start reviewing.');
  console.log('Capture verdicts on day, facet, and line cards, then run this report again.');
  printCoverage();
  printNextGaps();
  process.exit(0);
}

// ---- Revision queue: cut, then fix, then flat -------------------------------
const queue = revisionQueue(current);
const stale = staleJudgments(current, currentText);
const trust = current.filter((j) => j.tags.includes('source'));

// ---- Readiness --------------------------------------------------------------
const readinessBlockers = [
  coverage[0]!.unreviewed > 0 ? `${coverage[0]!.unreviewed} day card(s) unjudged` : undefined,
  coverage[1]!.unreviewed > 0 ? `${coverage[1]!.unreviewed} facet card(s) unjudged` : undefined,
  queue.length > 0 ? `${queue.length} current negative verdict(s)` : undefined,
  trust.length > 0 ? `${trust.length} source flag(s)` : undefined,
  stale.length > 0 ? `${stale.length} stale judgment(s)` : undefined,
].filter((x): x is string => Boolean(x));

console.log('Promotion readiness:');
if (readinessBlockers.length === 0) {
  console.log('  Ready for content promotion review. No blocking judgment signals remain.');
} else {
  console.log(`  Not ready: ${readinessBlockers.join('; ')}.`);
}

printCoverage();
printNextGaps();

console.log(`Revision queue (${queue.length}):`);
if (queue.length === 0) {
  console.log('  Nothing flagged. Everything reviewed currently reads as keep.');
} else {
  for (const j of queue) {
    const tags = j.tags.length ? `  [${j.tags.map((t) => TAG_LABELS[t]).join(', ')}]` : '';
    const stale = isStale(j, currentText) ? '  (stale: content changed since judged)' : '';
    console.log(
      `  ${VERDICT_LABELS[j.verdict].toUpperCase().padEnd(4)} ${locate(j.target)}${tags}${stale}`,
    );
    if (j.target.text) console.log(`       “${excerpt(j.target.text)}”`);
    if (j.note) console.log(`       note: ${j.note}`);
  }
}

if (queueOnly) process.exit(0);

// ---- Trust risks: every current source flag ---------------------------------
console.log(`\nTrust risks — source flags (${trust.length}):`);
if (trust.length === 0) {
  console.log('  None flagged.');
} else {
  for (const j of trust) {
    const note = j.note ? ` — ${j.note}` : '';
    console.log(`  ${locate(j.target)}: “${excerpt(j.target.text)}”${note}`);
  }
}

// ---- Signal summary ---------------------------------------------------------
console.log('\nVerdicts (current opinion per target):');
for (const v of ['keep', 'flat', 'fix', 'cut'] as Verdict[]) {
  console.log(`  ${VERDICT_LABELS[v].padEnd(5)} ${totals.byVerdict[v]}`);
}

console.log('\nTag signals:');
const tagEntries = Object.entries(totals.byTag)
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1]);
if (tagEntries.length === 0) console.log('  (none)');
else for (const [tag, n] of tagEntries) console.log(`  ${tag.padEnd(10)} ${n}`);

// ---- Per-level (lens) summary -----------------------------------------------
console.log('\nBy level:');
for (const row of byLevel(current)) {
  const v = row.byVerdict;
  console.log(
    `  ${LEVEL_LABELS[row.level].padEnd(12)} ${String(row.total).padStart(3)} judged  ·  keep ${v.keep}  flat ${v.flat}  fix ${v.fix}  cut ${v.cut}`,
  );
}

// ---- Per-day rollup ---------------------------------------------------------
console.log('\nPer day:');
const dayRows = [...totals.byDay.values()].sort((a, b) => a.day - b.day);
for (const row of dayRows) {
  const v = row.byVerdict;
  console.log(
    `  Day ${String(row.day).padStart(3)} ${row.slug.padEnd(18)} keep ${v.keep}  flat ${v.flat}  fix ${v.fix}  cut ${v.cut}`,
  );
}

// ---- Worst days / facets by negative signal ---------------------------------
const badDays = worstDays(current);
if (badDays.length) {
  console.log('\nWeakest days (by negative signal: cut x3, fix x2, flat x1):');
  for (const row of badDays.slice(0, 5)) {
    const v = row.byVerdict;
    console.log(
      `  ${String(row.negative).padStart(3)}  Day ${row.day} ${row.slug.padEnd(16)} cut ${v.cut}  fix ${v.fix}  flat ${v.flat}  keep ${v.keep}`,
    );
  }
}

const badFacets = worstFacets(current);
if (badFacets.length) {
  console.log('\nWeakest facets (by negative signal):');
  for (const row of badFacets.slice(0, 8)) {
    const v = row.byVerdict;
    console.log(
      `  ${String(row.negative).padStart(3)}  ${row.key.padEnd(24)} cut ${v.cut}  fix ${v.fix}  flat ${v.flat}  keep ${v.keep}`,
    );
  }
}

// ---- Strongest keeps --------------------------------------------------------
const keeps = strongestKeeps(current, 8);
if (keeps.length) {
  console.log(`\nStrongest keeps (${totals.byVerdict.keep} total, top ${keeps.length}):`);
  for (const j of keeps) {
    const tags = j.tags.length ? `  [${j.tags.map((t) => TAG_LABELS[t]).join(', ')}]` : '';
    console.log(`  ${locate(j.target)}${tags}`);
    if (j.target.text) console.log(`       “${excerpt(j.target.text)}”`);
  }
}

// ---- Staleness + integrity --------------------------------------------------
if (stale.length) {
  console.log(`\nStale (${stale.length}): judged before the content changed — re-review:`);
  for (const j of stale) console.log(`  ${locate(j.target)}`);
}
if (malformed.length) {
  console.log(`\nWarning: ${malformed.length} malformed ledger line(s) skipped.`);
  for (const m of malformed) console.log(`  line ${m.line}: ${m.error}`);
}

console.log(
  `\n${judgments.length} judgment(s) in the log · ${current.length} current target(s)${
    dayFilter ? ` in day ${dayFilter}` : ''
  }.`,
);

function printCoverage(): void {
  console.log('\nReview coverage:');
  for (const row of coverage) {
    console.log(
      `  ${row.label.padEnd(6)} ${String(row.percent).padStart(3)}%  ${String(row.reviewed).padStart(3)}/${String(row.total).padEnd(3)} reviewed  ·  ${row.unreviewed} gap(s)`,
    );
  }
}

function printNextGaps(): void {
  const lens: Lens =
    coverage[0]!.unreviewed > 0 ? 'day' : coverage[1]!.unreviewed > 0 ? 'facet' : 'line';
  const gaps = unreviewedTargets(buildFeed(daysInScope, lens), current, 8);
  console.log('\nNext judgment gaps:');
  if (gaps.length === 0) {
    console.log('  No unjudged targets in scope.');
    return;
  }
  console.log(`  Lens: ${LENS_LABELS[lens]}`);
  for (const gap of gaps) console.log(`  ${locate(gap.target)}`);
}
