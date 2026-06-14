import { describe, it, expect } from 'vitest';
import type { Day, Facet, FacetKey } from '@/content/types';
import { FACET_ORDER } from '@/content/types';
import { buildFeed } from './feed';

function facet(key: FacetKey, over: Partial<Facet> = {}): Facet {
  return {
    key,
    oneWord: `${key}Word`,
    title: `${key} Title`,
    body: `First ${key} sentence. Second ${key} sentence.`,
    sources: [{ kind: 'secondary', title: 's' }],
    ...over,
  } as Facet;
}

function day(over: Partial<Day> = {}): Day {
  const facets = Object.fromEntries(
    FACET_ORDER.map((k) => [k, facet(k)]),
  ) as unknown as Day['facets'];
  return {
    schemaVersion: 1,
    index: 1,
    slug: 'hubris',
    theme: 'Hubris',
    status: 'published',
    registers: ['elegy'],
    regions: ['europe'],
    eras: ['ancient'],
    facets,
    resonanceThreads: [{ facets: ['poem', 'picture'], note: 'they rhyme' }],
    ...over,
  };
}

describe('buildFeed', () => {
  it('day lens yields one item per day, carrying the theme target', () => {
    const feed = buildFeed([day(), day({ index: 2, slug: 'patience', theme: 'Patience' })], 'day');
    expect(feed).toHaveLength(2);
    expect(feed[0]!.target.level).toBe('day');
    expect(feed[0]!.heading).toBe('Hubris');
    expect(feed[1]!.target.slug).toBe('patience');
  });

  it('facet lens yields six items per day in charter order', () => {
    const feed = buildFeed([day()], 'facet');
    expect(feed).toHaveLength(6);
    expect(feed.map((i) => i.target.facet)).toEqual([...FACET_ORDER]);
    expect(feed[0]!.target.level).toBe('facet');
    expect(feed[0]!.body).toContain('First person sentence');
  });

  it('line lens explodes each facet into reveal word, title, and sentences', () => {
    const feed = buildFeed([day()], 'line');
    // 6 facets * (1 oneWord + 1 title + 2 sentences) = 24
    expect(feed).toHaveLength(24);

    const personItems = feed.filter((i) => i.target.facet === 'person');
    expect(personItems.map((i) => i.target.level)).toEqual([
      'oneWord',
      'title',
      'sentence',
      'sentence',
    ]);
    expect(personItems[2]!.target.sentenceIndex).toBe(0);
    expect(personItems[2]!.target.text).toBe('First person sentence.');
  });

  it('gives every feed item a unique, stable id', () => {
    const feed = buildFeed([day()], 'line');
    const ids = new Set(feed.map((i) => i.id));
    expect(ids.size).toBe(feed.length);
  });

  it('carries the day status onto each item for filtering', () => {
    const feed = buildFeed([day({ status: 'draft' })], 'facet');
    expect(feed.every((i) => i.status === 'draft')).toBe(true);
  });
});
