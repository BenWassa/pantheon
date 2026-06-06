import type { FacetKey } from '@/content/types';

// Human-readable labels for the six fixed facets.
export const FACET_LABELS: Record<FacetKey, string> = {
  person: 'Person',
  picture: 'Picture',
  poem: 'Poem',
  principle: 'Principle',
  passage: 'Passage',
  parallel: 'Parallel',
};

// A one-line description of what each facet offers, for subtle UI hints.
export const FACET_DESCRIPTIONS: Record<FacetKey, string> = {
  person: 'A single human life that embodies the theme.',
  picture: 'A single visual work, and how to look at it.',
  poem: 'A single poem.',
  principle: 'The idea at the theme’s spine.',
  passage: 'A passage of wisdom, sacred, or literary text.',
  parallel: 'The bridge from history to now.',
};
