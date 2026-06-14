// Read and write the Studio judgment ledger (content/judgments.jsonl).
//
// The ledger is append-only JSONL: one judgment per line, in capture order. It is
// tracked in git so judgments are durable and version-controlled, but it is never
// copied into the reader build (see scripts/build-manifest.ts). Re-judging a span
// appends a new line; latestByTarget collapses the log to the current verdict.

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Judgment } from '@/content/judgments';
import { JUDGMENTS_FILE } from './paths.ts';

export interface ParsedLedger {
  judgments: Judgment[];
  malformed: { line: number; raw: string; error: string }[];
}

// Parse JSONL text, tolerating blank lines and surfacing (not throwing on) bad
// lines so a single corrupt entry never hides the rest of the review history.
export function parseLedger(text: string): ParsedLedger {
  const judgments: Judgment[] = [];
  const malformed: ParsedLedger['malformed'] = [];

  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '') return;
    try {
      judgments.push(JSON.parse(trimmed) as Judgment);
    } catch (e) {
      malformed.push({
        line: i + 1,
        raw: trimmed,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return { judgments, malformed };
}

export function readLedger(file: string = JUDGMENTS_FILE): ParsedLedger {
  if (!existsSync(file)) return { judgments: [], malformed: [] };
  return parseLedger(readFileSync(file, 'utf8'));
}

export function appendJudgment(judgment: Judgment, file: string = JUDGMENTS_FILE): void {
  appendFileSync(file, JSON.stringify(judgment) + '\n');
}

// Remove a judgment by id (undo). Rewrites the log without that line. Returns
// whether anything was removed.
export function removeJudgment(id: string, file: string = JUDGMENTS_FILE): boolean {
  if (!existsSync(file)) return false;
  const { judgments } = readLedger(file);
  const kept = judgments.filter((j) => j.id !== id);
  if (kept.length === judgments.length) return false;
  writeFileSync(file, kept.map((j) => JSON.stringify(j)).join('\n') + (kept.length ? '\n' : ''));
  return true;
}

const VERDICTS = new Set(['keep', 'flat', 'fix', 'cut']);
const LEVELS = new Set(['day', 'facet', 'title', 'oneWord', 'sentence']);
const TAGS = new Set([
  'resonance',
  'coherence',
  'voice',
  'clarity',
  'rhythm',
  'cliche',
  'source',
  'copy',
]);

// A lightweight structural check for an incoming judgment, used by the dev server
// before it appends. Keeps the trust ethos: a malformed signal never enters the
// ledger. (The JSON Schema under /schema documents the same shape.)
export function validateJudgment(
  value: unknown,
): { ok: true; judgment: Judgment } | { ok: false; error: string } {
  if (typeof value !== 'object' || value === null) return { ok: false, error: 'not an object' };
  const v = value as Record<string, unknown>;

  if (typeof v.id !== 'string' || v.id === '')
    return { ok: false, error: 'id must be a non-empty string' };
  if (typeof v.at !== 'string' || Number.isNaN(Date.parse(v.at)))
    return { ok: false, error: 'at must be an ISO timestamp' };
  if (typeof v.verdict !== 'string' || !VERDICTS.has(v.verdict))
    return { ok: false, error: `verdict must be one of ${[...VERDICTS].join(', ')}` };
  if (!Array.isArray(v.tags) || !v.tags.every((t) => typeof t === 'string' && TAGS.has(t)))
    return { ok: false, error: 'tags must be an array of known tags' };
  if (v.note !== undefined && typeof v.note !== 'string')
    return { ok: false, error: 'note must be a string' };

  const t = v.target as Record<string, unknown> | undefined;
  if (typeof t !== 'object' || t === null) return { ok: false, error: 'target is required' };
  if (typeof t.level !== 'string' || !LEVELS.has(t.level))
    return { ok: false, error: 'target.level invalid' };
  if (typeof t.day !== 'number' || !Number.isInteger(t.day) || t.day < 1)
    return { ok: false, error: 'target.day must be a positive integer' };
  if (typeof t.slug !== 'string' || t.slug === '')
    return { ok: false, error: 'target.slug must be a non-empty string' };

  return { ok: true, judgment: value as Judgment };
}
