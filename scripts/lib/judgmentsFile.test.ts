import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Judgment } from '@/content/judgments';
import {
  appendJudgment,
  parseLedger,
  readLedger,
  removeJudgment,
  validateJudgment,
} from './judgmentsFile.ts';

const tmpDirs: string[] = [];
function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pantheon-judgments-'));
  tmpDirs.push(dir);
  return join(dir, 'judgments.jsonl');
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

function j(id: string, over: Partial<Judgment> = {}): Judgment {
  return {
    id,
    at: '2026-06-14T00:00:00.000Z',
    target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person' },
    verdict: 'keep',
    tags: [],
    ...over,
  };
}

describe('parseLedger', () => {
  it('parses lines, skips blanks, and reports malformed entries', () => {
    const text = [JSON.stringify(j('1')), '', '{not json}', JSON.stringify(j('2'))].join('\n');
    const { judgments, malformed } = parseLedger(text);
    expect(judgments.map((x) => x.id)).toEqual(['1', '2']);
    expect(malformed).toHaveLength(1);
    expect(malformed[0]!.line).toBe(3);
  });
});

describe('append / read / remove round-trip', () => {
  it('appends judgments and reads them back in order', () => {
    const file = tmpFile();
    appendJudgment(j('1'), file);
    appendJudgment(j('2', { verdict: 'cut' }), file);
    const { judgments } = readLedger(file);
    expect(judgments.map((x) => [x.id, x.verdict])).toEqual([
      ['1', 'keep'],
      ['2', 'cut'],
    ]);
  });

  it('reads an empty ledger when the file does not exist', () => {
    expect(readLedger(tmpFile())).toEqual({ judgments: [], malformed: [] });
  });

  it('removes a judgment by id and leaves the rest intact', () => {
    const file = tmpFile();
    appendJudgment(j('1'), file);
    appendJudgment(j('2'), file);
    expect(removeJudgment('1', file)).toBe(true);
    expect(readLedger(file).judgments.map((x) => x.id)).toEqual(['2']);
    expect(removeJudgment('missing', file)).toBe(false);
  });

  it('empties the file when the last judgment is removed', () => {
    const file = tmpFile();
    appendJudgment(j('only'), file);
    expect(removeJudgment('only', file)).toBe(true);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe('');
  });
});

describe('validateJudgment', () => {
  it('accepts a well-formed judgment', () => {
    const res = validateJudgment(j('1', { tags: ['source', 'cliche'], note: 'hi' }));
    expect(res.ok).toBe(true);
  });

  it('rejects bad verdicts, tags, targets, and timestamps', () => {
    expect(validateJudgment(null).ok).toBe(false);
    expect(validateJudgment(j('1', { verdict: 'nope' as never })).ok).toBe(false);
    expect(validateJudgment(j('1', { tags: ['bogus' as never] })).ok).toBe(false);
    expect(validateJudgment(j('1', { at: 'not-a-date' })).ok).toBe(false);
    expect(
      validateJudgment(j('1', { target: { level: 'facet', day: 0, slug: '' } as never })).ok,
    ).toBe(false);
  });
});
