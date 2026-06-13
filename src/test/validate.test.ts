import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateAll, validateDayObject } from '../../scripts/lib/validateContent.ts';
import type { Day } from '@/content/types';

function loadHubris(): Day {
  return JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'content', 'days', '001-hubris.json'), 'utf8'),
  ) as Day;
}

describe('content gate', () => {
  it('the shipped library passes validation with no errors', () => {
    const result = validateAll();
    expect(result.daysChecked).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('the Hubris calibration day is valid on its own', () => {
    const result = validateDayObject(loadHubris(), '001-hubris.json');
    expect(result.errors).toEqual([]);
  });

  it('rejects a body containing an em dash', () => {
    const broken = loadHubris();
    broken.facets.person.body += ' an aside — like this.';
    const result = validateDayObject(broken);
    expect(result.errors.some((e) => e.message.includes('em dash'))).toBe(true);
  });

  it('rejects a facet with no sources', () => {
    const broken = loadHubris();
    broken.facets.principle.sources = [];
    const result = validateDayObject(broken);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects a day with no resonance threads', () => {
    const broken = loadHubris();
    broken.resonanceThreads = [];
    const result = validateDayObject(broken);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects a body outside the 80-130 word band', () => {
    const broken = loadHubris();
    broken.facets.parallel.body = 'Too short.';
    const result = validateDayObject(broken);
    expect(result.errors.some((e) => e.message.includes('words'))).toBe(true);
  });

  it('rejects a day whose grid words are not all distinct', () => {
    const broken = loadHubris();
    broken.facets.picture.oneWord = broken.facets.person.oneWord;
    const result = validateDayObject(broken);
    expect(result.errors.some((e) => e.message.includes('duplicates'))).toBe(true);
  });

  it('rejects a published day that still carries placeholder text', () => {
    const broken = loadHubris();
    broken.facets.person.body = `Placeholder content, pending research. ${broken.facets.person.body}`;
    const result = validateDayObject(broken);
    expect(result.errors.some((e) => e.message.includes('placeholder'))).toBe(true);
  });

  it('allows placeholder text on a non-published (draft) day', () => {
    const draft = loadHubris();
    draft.status = 'draft';
    draft.facets.person.body = `Placeholder content, pending research. ${draft.facets.person.body}`;
    const result = validateDayObject(draft);
    expect(result.errors.some((e) => e.message.includes('placeholder'))).toBe(false);
  });
});
