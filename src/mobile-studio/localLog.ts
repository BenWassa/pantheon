// The local judgment log: where the mobile Studio keeps judgments when no dev
// backend is reachable (i.e. on GitHub Pages). It mirrors the on-disk ledger's
// shape (an append-only list of Judgment records) so the captured signal is the
// same currency as content/judgments.jsonl and can be merged straight into it.

import type { Judgment } from '@/content/judgments';
import { latestByTarget, LEVEL_LABELS, TAG_LABELS, VERDICT_LABELS } from '@/content/judgments';
import { FACET_LABELS } from '@/lib/facetLabels';

const STORAGE_KEY = 'pantheon.studio.judgments.v1';
const VERSION = 1 as const;

interface Envelope {
  version: 1;
  judgments: Judgment[];
}

export function loadLocal(): Judgment[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope>;
    if (parsed.version !== VERSION || !Array.isArray(parsed.judgments)) return [];
    return parsed.judgments;
  } catch {
    return [];
  }
}

function persist(judgments: Judgment[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const envelope: Envelope = { version: VERSION, judgments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage unavailable (private mode, quota): keep going in memory.
  }
}

export function appendLocal(judgment: Judgment): Judgment[] {
  const next = [...loadLocal(), judgment];
  persist(next);
  return next;
}

export function removeLocal(id: string): Judgment[] {
  const next = loadLocal().filter((j) => j.id !== id);
  persist(next);
  return next;
}

export function replaceLocal(judgments: Judgment[]): void {
  persist(judgments);
}

// Union two logs by id, oldest-first by capture time. Re-importing an exported
// file never duplicates, and full history is preserved.
export function mergeJudgments(a: Judgment[], b: Judgment[]): Judgment[] {
  const byId = new Map<string, Judgment>();
  for (const j of [...a, ...b]) byId.set(j.id, j);
  return [...byId.values()].sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
}

// Export as JSONL, the exact format of content/judgments.jsonl, so the file can be
// appended to the ledger verbatim. Only the current opinion per target is exported
// (history stays on the device) to keep the ledger clean.
export function exportJsonl(judgments: Judgment[]): string {
  const latest = [...latestByTarget(judgments).values()].sort((a, b) => (a.at < b.at ? -1 : 1));
  if (latest.length === 0) return '';
  return latest.map((j) => JSON.stringify(j)).join('\n') + '\n';
}

// A human-readable record of the decisions and choices made, grouped by day. This
// is the "what did I decide" export — plain Markdown for the reviewer, distinct
// from the JSONL the pipeline ingests. Only the current opinion per target.
export function exportSummary(judgments: Judgment[]): string {
  const latest = [...latestByTarget(judgments).values()];
  if (latest.length === 0) return '# Pantheon Studio — decisions\n\n_No decisions captured yet._\n';

  // Group by day, days ascending, and within a day put the whole-day verdict first.
  const byDay = new Map<string, { day: number; slug: string; items: Judgment[] }>();
  for (const j of latest) {
    const key = j.target.slug;
    const group = byDay.get(key) ?? { day: j.target.day, slug: j.target.slug, items: [] };
    group.items.push(j);
    byDay.set(key, group);
  }
  const groups = [...byDay.values()].sort((a, b) => a.day - b.day);

  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    '# Pantheon Studio — decisions',
    '',
    `_Exported ${date} · ${latest.length} decision${latest.length === 1 ? '' : 's'}._`,
    '',
  ];

  for (const group of groups) {
    lines.push(`## Day ${group.day} · ${group.slug}`);
    const items = group.items.sort((a, b) => {
      if (a.target.level === 'day') return -1;
      if (b.target.level === 'day') return 1;
      return (a.target.facet ?? '').localeCompare(b.target.facet ?? '');
    });
    for (const j of items) {
      const scope =
        j.target.level === 'day'
          ? 'Whole day'
          : j.target.facet
            ? FACET_LABELS[j.target.facet]
            : LEVEL_LABELS[j.target.level];
      const tags = j.tags.length > 0 ? `  _[${j.tags.map((t) => TAG_LABELS[t]).join(', ')}]_` : '';
      lines.push(`- **${VERDICT_LABELS[j.verdict]}** — ${scope}${tags}`);
      if (j.note) lines.push(`  - note: ${j.note}`);
      if (j.suggestion) lines.push(`  - suggestion: ${j.suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Parse an imported file: a JSON array of judgments, or JSONL (one per line).
export function parseImport(text: string): Judgment[] {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(arr)) throw new Error('Expected a JSON array of judgments.');
    return arr as Judgment[];
  }
  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Judgment);
}
