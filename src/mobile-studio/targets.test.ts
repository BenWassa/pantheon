import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Day } from '@/content/types';
import { FACET_ORDER } from '@/content/types';
import { targetId } from '@/content/judgments';
import { buildFeed } from '@/studio/feed';
import { dayTarget, facetTarget } from './targets';

const hubris = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'content', 'days', '001-hubris.json'), 'utf8'),
) as Day;

// The mobile Studio must produce the same target identity as the desktop Studio so
// a phone judgment collapses onto the same target in the report. This locks that
// parity against drift in either feed.
describe('mobile studio targets mirror the desktop feed', () => {
  it('facet targets share their id with the feed facet items', () => {
    const ids = new Set(buildFeed([hubris], 'facet').map((i) => i.id));
    for (const key of FACET_ORDER) {
      expect(ids.has(targetId(facetTarget(hubris, key)))).toBe(true);
    }
  });

  it('the day target shares its id with the feed day item', () => {
    const dayFeed = buildFeed([hubris], 'day');
    expect(dayFeed[0]?.id).toBe(targetId(dayTarget(hubris)));
  });
});
