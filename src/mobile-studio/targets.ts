import type { Day, FacetKey } from '@/content/types';
import type { JudgmentTarget } from '@/content/judgments';

// The mobile Studio judges at two grains: a whole facet (one swipe card) and the
// whole day. These targets mirror src/studio/feed.ts exactly, so a judgment made
// on the phone collapses onto the same target as one made in the desktop Studio
// (see targetId) and flows into the same revision report. Keep them in sync; the
// parity is locked by targets.test.ts.

export function facetTarget(day: Day, key: FacetKey): JudgmentTarget {
  return {
    level: 'facet',
    day: day.index,
    slug: day.slug,
    facet: key,
    text: day.facets[key].title,
  };
}

export function dayTarget(day: Day): JudgmentTarget {
  return {
    level: 'day',
    day: day.index,
    slug: day.slug,
    field: 'theme',
    text: day.theme,
  };
}
