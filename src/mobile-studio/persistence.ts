import type { FacetKey } from '@/content/types';
import type { MobileComment, MobileReaction, MobileReactionType, MobileStudioState } from './types';

const STORAGE_KEY = 'pantheon.mobile-studio.v1';
const VERSION = 1 as const;

function emptyState(): MobileStudioState {
  return { version: VERSION, reactions: [], comments: [] };
}

export function loadMobileState(): MobileStudioState {
  if (typeof localStorage === 'undefined') return emptyState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<MobileStudioState>;
    if (parsed.version !== VERSION) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(state: MobileStudioState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota); continue in-memory.
  }
}

export function setReaction(
  state: MobileStudioState,
  daySlug: string,
  facetKey: FacetKey,
  reaction: MobileReactionType,
): MobileStudioState {
  const reactions: MobileReaction[] = [
    ...state.reactions.filter((r) => !(r.daySlug === daySlug && r.facetKey === facetKey)),
    { daySlug, facetKey, reaction, at: new Date().toISOString() },
  ];
  const next = { ...state, reactions };
  save(next);
  return next;
}

export function clearReaction(
  state: MobileStudioState,
  daySlug: string,
  facetKey: FacetKey,
): MobileStudioState {
  const next = {
    ...state,
    reactions: state.reactions.filter((r) => !(r.daySlug === daySlug && r.facetKey === facetKey)),
  };
  save(next);
  return next;
}

export function addComment(
  state: MobileStudioState,
  daySlug: string,
  facetKey: FacetKey,
  text: string,
): MobileStudioState {
  const comment: MobileComment = {
    id: `${daySlug}-${facetKey}-${Date.now()}`,
    daySlug,
    facetKey,
    text: text.trim(),
    at: new Date().toISOString(),
  };
  const next = { ...state, comments: [...state.comments, comment] };
  save(next);
  return next;
}

export function getReaction(
  state: MobileStudioState,
  daySlug: string,
  facetKey: FacetKey,
): MobileReactionType | undefined {
  return state.reactions.find((r) => r.daySlug === daySlug && r.facetKey === facetKey)?.reaction;
}

export function getComments(
  state: MobileStudioState,
  daySlug: string,
  facetKey: FacetKey,
): MobileComment[] {
  return state.comments.filter((c) => c.daySlug === daySlug && c.facetKey === facetKey);
}
