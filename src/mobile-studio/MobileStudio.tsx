import { useCallback, useEffect, useRef, useState } from 'react';
import { loadManifest } from '@/content/loadManifest';
import { loadDay } from '@/content/loadDay';
import { FACET_ORDER, type Day, type FacetKey, type ManifestEntry } from '@/content/types';
import type { Facet } from '@/content/types';
import { CommentSheet } from './CommentSheet';
import { DayPicker } from './DayPicker';
import { FacetCard } from './FacetCard';
import { ReactionBar } from './ReactionBar';
import { useSwipeDeck } from './useSwipeDeck';
import {
  addComment,
  clearReaction,
  getComments,
  getReaction,
  loadMobileState,
  setReaction,
} from './persistence';
import type { MobileReactionType, MobileStudioState } from './types';

// ---- Skeleton ---------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col bg-night animate-pulse">
      <div className="h-[42dvh] flex-shrink-0 bg-night-soft" />
      <div className="flex-1 px-5 pt-5">
        <div className="mb-2 h-2 w-12 rounded bg-night-raised" />
        <div className="mb-3 h-10 w-40 rounded bg-night-raised" />
        <div className="mb-6 h-4 w-56 rounded bg-night-raised" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-night-raised" />
          <div className="h-3 w-[90%] rounded bg-night-raised" />
          <div className="h-3 w-[80%] rounded bg-night-raised" />
          <div className="h-3 w-[95%] rounded bg-night-raised" />
          <div className="h-3 w-[70%] rounded bg-night-raised" />
        </div>
      </div>
    </div>
  );
}

// ---- Error state ------------------------------------------------------------

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="font-sans text-xs uppercase tracking-widest2 text-ember">Could not load</p>
      <p className="font-body text-sm text-ink-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-night-raised px-4 py-2 font-sans text-xs text-ink-faint active:text-ink"
      >
        Try again
      </button>
    </div>
  );
}

// ---- Root -------------------------------------------------------------------

export function MobileStudio() {
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [day, setDay] = useState<Day | null>(null);
  const [facetIndex, setFacetIndex] = useState(0);
  const [enterFrom, setEnterFrom] = useState<'bottom' | 'top' | null>(null);
  const [mobileState, setMobileState] = useState<MobileStudioState>(loadMobileState);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [visitedFacets, setVisitedFacets] = useState<Set<FacetKey>>(new Set(['person']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Manifest load --------------------------------------------------------

  const fetchManifest = useCallback(() => {
    setLoading(true);
    setError(null);
    loadManifest()
      .then((m) => {
        const days = m.days;
        setManifest(days);
        // Start on the most recent (last) published day.
        setDayIndex(days.length > 0 ? days.length - 1 : 0);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error loading manifest.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  // ---- Day load -------------------------------------------------------------

  useEffect(() => {
    if (!manifest || manifest.length === 0) return;
    const entry = manifest[dayIndex];
    if (!entry) return;

    setLoading(true);
    setDay(null);
    setFacetIndex(0);
    setVisitedFacets(new Set<FacetKey>(['person']));

    loadDay(entry)
      .then((d) => {
        setDay(d);
        setLoading(false);
        // Silently prefetch adjacent days.
        const next = manifest[dayIndex + 1];
        if (next) loadDay(next).catch(() => {});
        const prev = manifest[dayIndex - 1];
        if (prev) loadDay(prev).catch(() => {});
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error loading day.');
        setLoading(false);
      });
  }, [manifest, dayIndex]);

  // Prefetch the next facet's image when current facet changes.
  useEffect(() => {
    if (!day) return;
    const nextKey = FACET_ORDER[facetIndex + 1];
    if (!nextKey) return;
    const nextFacet = day.facets[nextKey] as Facet;
    const img = 'image' in nextFacet ? nextFacet.image : undefined;
    if (img) {
      const el = new Image();
      el.src = img.src;
    }
  }, [day, facetIndex]);

  // ---- Navigation -----------------------------------------------------------

  const canGoNext =
    !loading &&
    !!day &&
    (facetIndex < FACET_ORDER.length - 1 || (manifest !== null && dayIndex < manifest.length - 1));

  const canGoPrev = !loading && !!day && (facetIndex > 0 || dayIndex > 0);

  const goNext = useCallback(() => {
    if (facetIndex < FACET_ORDER.length - 1) {
      const nextKey = FACET_ORDER[facetIndex + 1] as FacetKey;
      setEnterFrom('bottom');
      setFacetIndex((f) => f + 1);
      setVisitedFacets((prev) => new Set<FacetKey>([...prev, nextKey]));
      // Reset scroll position for new card.
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (manifest && dayIndex < manifest.length - 1) {
      setEnterFrom('bottom');
      setDayIndex((d) => d + 1);
    }
  }, [facetIndex, dayIndex, manifest]);

  const goPrev = useCallback(() => {
    if (facetIndex > 0) {
      setEnterFrom('top');
      setFacetIndex((f) => f - 1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (dayIndex > 0) {
      setEnterFrom('top');
      setDayIndex((d) => d - 1);
      setFacetIndex(FACET_ORDER.length - 1);
    }
  }, [facetIndex, dayIndex]);

  const goNextDay = useCallback(() => {
    if (manifest && dayIndex < manifest.length - 1) {
      setEnterFrom('bottom');
      setDayIndex((d) => d + 1);
    }
  }, [manifest, dayIndex]);

  const goPrevDay = useCallback(() => {
    if (dayIndex > 0) {
      setEnterFrom('top');
      setDayIndex((d) => d - 1);
    }
  }, [dayIndex]);

  // ---- Swipe gesture --------------------------------------------------------

  const { elementRef, handlers } = useSwipeDeck({
    onNext: goNext,
    onPrev: goPrev,
    contentScrollRef: scrollRef,
  });

  // ---- Reactions & comments -------------------------------------------------

  // facetIndex is always 0–5, so the cast to FacetKey is safe.
  const currentFacetKey = (FACET_ORDER[facetIndex] ?? 'person') as FacetKey;
  const daySlug = day?.slug ?? '';

  const currentReaction = day ? getReaction(mobileState, daySlug, currentFacetKey) : undefined;
  const currentComments = day ? getComments(mobileState, daySlug, currentFacetKey) : [];

  function handleReact(type: MobileReactionType) {
    if (!day) return;
    const next =
      currentReaction === type
        ? clearReaction(mobileState, daySlug, currentFacetKey)
        : setReaction(mobileState, daySlug, currentFacetKey, type);
    setMobileState(next);
  }

  function handleAddComment(text: string) {
    if (!day) return;
    setMobileState(addComment(mobileState, daySlug, currentFacetKey, text));
  }

  // ---- Render ---------------------------------------------------------------

  const currentFacet = day ? (day.facets[currentFacetKey] as Facet) : null;
  const entry = manifest ? manifest[dayIndex] : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-night text-ink">
      {/* Day picker header */}
      <DayPicker
        theme={day?.theme ?? entry?.theme ?? '…'}
        dayNumber={day?.index ?? entry?.index ?? dayIndex + 1}
        facetIndex={facetIndex}
        visitedFacets={visitedFacets}
        canPrev={dayIndex > 0}
        canNext={!!manifest && dayIndex < manifest.length - 1}
        onPrevDay={goPrevDay}
        onNextDay={goNextDay}
      />

      {/* Card deck */}
      <div ref={elementRef} className="min-h-0 flex-1 will-change-transform" {...handlers}>
        {loading || !currentFacet ? (
          error ? (
            <ErrorState message={error} onRetry={fetchManifest} />
          ) : (
            <CardSkeleton />
          )
        ) : (
          <FacetCard
            key={`${daySlug}-${currentFacetKey}`}
            facet={currentFacet}
            enterFrom={enterFrom}
            scrollRef={scrollRef}
          />
        )}
      </div>

      {/* Reaction bar */}
      <ReactionBar
        reaction={currentReaction}
        commentCount={currentComments.length}
        canPrev={canGoPrev}
        canNext={canGoNext}
        onReact={handleReact}
        onOpenComments={() => setCommentSheetOpen(true)}
        onPrev={goPrev}
        onNext={goNext}
      />

      {/* Comment sheet */}
      <CommentSheet
        open={commentSheetOpen}
        comments={currentComments}
        onClose={() => setCommentSheetOpen(false)}
        onSubmit={handleAddComment}
      />
    </div>
  );
}
