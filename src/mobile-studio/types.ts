import type { FacetKey } from '@/content/types';

export type MobileReactionType = 'love' | 'save' | 'skip';

export interface MobileReaction {
  daySlug: string;
  facetKey: FacetKey;
  reaction: MobileReactionType;
  at: string;
}

export interface MobileComment {
  id: string;
  daySlug: string;
  facetKey: FacetKey;
  text: string;
  at: string;
}

export interface MobileStudioState {
  version: 1;
  reactions: MobileReaction[];
  comments: MobileComment[];
}
