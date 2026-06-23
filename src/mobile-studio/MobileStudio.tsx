import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FACET_ORDER, type Day, type FacetKey } from '@/content/types';
import {
  latestByTarget,
  makeJudgmentId,
  targetId,
  type Judgment,
  type JudgmentTag,
  type JudgmentTarget,
  type Severity,
  type Verdict,
} from '@/content/judgments';
import { FACET_LABELS } from '@/lib/facetLabels';
import { DayPicker } from './DayPicker';
import { FacetCard } from './FacetCard';
import { NoteSheet, type NoteDraft } from './NoteSheet';
import { SyncSheet } from './SyncSheet';
import { VerdictBar } from './VerdictBar';
import { useSwipeDeck } from './useSwipeDeck';
import { detectBackend } from './backend';
import { replaceLocal } from './localLog';
import { dayTarget, facetTarget } from './targets';
import { facetImageUrl } from './images';
import type { BackendMode, StudioBackend } from './types';

// ---- Loading / empty states -------------------------------------------------

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col bg-night animate-pulse">
      <div className="h-[42dvh] flex-shrink-0 bg-night-soft" />
      <div className="flex-1 px-5 pt-5">
        <div className="mb-3 h-10 w-40 rounded bg-night-raised" />
        <div className="mb-6 h-4 w-56 rounded bg-night-raised" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-night-raised" />
          <div className="h-3 w-[90%] rounded bg-night-raised" />
          <div className="h-3 w-[80%] rounded bg-night-raised" />
        </div>
      </div>
    </div>
  );
}

function FullState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="font-sans text-xs uppercase tracking-widest2 text-ember">{title}</p>
      <p className="font-body text-sm text-ink-muted">{message}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded border border-night-raised px-4 py-2 font-sans text-xs text-ink-faint active:text-ink"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

// ---- Root -------------------------------------------------------------------

type NoteContext = { kind: 'facet'; facet: FacetKey } | { kind: 'day' } | null;

export function MobileStudio() {
  const [backend, setBackend] = useState<StudioBackend | null>(null);
  const [mode, setMode] = useState<BackendMode>('local');
  const [days, setDays] = useState<Day[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [facetIndex, setFacetIndex] = useState(0);
  const [enterFrom, setEnterFrom] = useState<'bottom' | 'top' | null>(null);
  const [noteContext, setNoteContext] = useState<NoteContext>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const judgmentsRef = useRef<Judgment[]>([]);
  judgmentsRef.current = judgments;
  const backendRef = useRef<StudioBackend | null>(null);
  backendRef.current = backend;

  // ---- Load -----------------------------------------------------------------

  const init = useCallback(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const chosen = await detectBackend();
        const [loadedDays, loadedJudgments] = await Promise.all([
          chosen.loadDays(),
          chosen.loadJudgments(),
        ]);
        setBackend(chosen);
        setMode(chosen.mode);
        setDays(loadedDays);
        setJudgments(loadedJudgments);
        setDayIndex(loadedDays.length > 0 ? loadedDays.length - 1 : 0);
        setFacetIndex(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the studio.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const day = days[dayIndex] ?? null;
  const currentFacetKey = FACET_ORDER[facetIndex] ?? 'person';
  const currentFacet = day ? day.facets[currentFacetKey] : null;

  // Prefetch the next facet's image, base-aware so it warms the right cache entry.
  useEffect(() => {
    if (!day) return;
    const withinDay = Boolean(FACET_ORDER[facetIndex + 1]);
    const nextDay = withinDay ? day : (days[dayIndex + 1] ?? null);
    const nextKey = withinDay ? FACET_ORDER[facetIndex + 1] : FACET_ORDER[0];
    if (!nextDay || !nextKey) return;
    const facet = nextDay.facets[nextKey];
    const image = 'image' in facet ? facet.image : undefined;
    if (image) new Image().src = facetImageUrl(image);
  }, [day, days, dayIndex, facetIndex]);

  // ---- Derived judgment state ----------------------------------------------

  const latest = useMemo(() => latestByTarget(judgments), [judgments]);

  const facetVerdicts = useMemo<(Verdict | undefined)[]>(() => {
    if (!day) return FACET_ORDER.map(() => undefined);
    return FACET_ORDER.map((key) => latest.get(targetId(facetTarget(day, key)))?.verdict);
  }, [day, latest]);

  const dayVerdict = day ? latest.get(targetId(dayTarget(day)))?.verdict : undefined;
  const currentJudgment = day ? latest.get(targetId(facetTarget(day, currentFacetKey))) : undefined;
  const currentVerdict = currentJudgment?.verdict;
  const currentHasDetail = Boolean(
    currentJudgment &&
    ((currentJudgment.tags?.length ?? 0) > 0 || currentJudgment.note || currentJudgment.suggestion),
  );
  const opinionCount = latest.size;

  // ---- Navigation -----------------------------------------------------------

  const navNext = useCallback(() => {
    if (facetIndex < FACET_ORDER.length - 1) {
      setEnterFrom('bottom');
      setFacetIndex(facetIndex + 1);
    } else if (dayIndex < days.length - 1) {
      setEnterFrom('bottom');
      setDayIndex(dayIndex + 1);
      setFacetIndex(0);
    }
  }, [facetIndex, dayIndex, days.length]);

  const navPrev = useCallback(() => {
    if (facetIndex > 0) {
      setEnterFrom('top');
      setFacetIndex(facetIndex - 1);
    } else if (dayIndex > 0) {
      setEnterFrom('top');
      setDayIndex(dayIndex - 1);
      setFacetIndex(FACET_ORDER.length - 1);
    }
  }, [facetIndex, dayIndex]);

  const navNextRef = useRef(navNext);
  navNextRef.current = navNext;

  const selectFacet = useCallback(
    (i: number) => {
      setEnterFrom(i > facetIndex ? 'bottom' : i < facetIndex ? 'top' : null);
      setFacetIndex(i);
    },
    [facetIndex],
  );

  const prevDay = useCallback(() => {
    if (dayIndex > 0) {
      setEnterFrom('top');
      setDayIndex(dayIndex - 1);
      setFacetIndex(0);
    }
  }, [dayIndex]);

  const nextDay = useCallback(() => {
    if (dayIndex < days.length - 1) {
      setEnterFrom('bottom');
      setDayIndex(dayIndex + 1);
      setFacetIndex(0);
    }
  }, [dayIndex, days.length]);

  const { elementRef, handlers } = useSwipeDeck({
    onNext: navNext,
    onPrev: navPrev,
    contentScrollRef: scrollRef,
  });

  // ---- Recording ------------------------------------------------------------

  const commit = useCallback(
    (
      target: JudgmentTarget,
      changes: {
        verdict?: Verdict;
        note?: string;
        tags?: JudgmentTag[];
        severity?: Severity;
        suggestion?: string;
      },
    ) => {
      const active = backendRef.current;
      if (!active) return;
      const existing = latestByTarget(judgmentsRef.current).get(targetId(target));
      const verdict = changes.verdict ?? existing?.verdict;
      if (!verdict) return; // a judgment needs a verdict

      const judgment: Judgment = {
        id: makeJudgmentId(),
        at: new Date().toISOString(),
        target,
        verdict,
        tags: changes.tags ?? existing?.tags ?? [],
        note: (changes.note ?? existing?.note ?? '').trim() || undefined,
        severity: verdict === 'keep' ? undefined : (changes.severity ?? existing?.severity),
        suggestion: (changes.suggestion ?? existing?.suggestion ?? '').trim() || undefined,
      };

      setJudgments((prev) => [...prev, judgment]); // optimistic
      void active.submit(judgment).catch((e: unknown) => {
        setJudgments((prev) => prev.filter((j) => j.id !== judgment.id));
        setToast(e instanceof Error ? `Not saved: ${e.message}` : 'Not saved.');
        setTimeout(() => setToast(null), 2600);
      });
    },
    [],
  );

  const handleVerdict = useCallback(
    (verdict: Verdict) => {
      if (!day) return;
      commit(facetTarget(day, currentFacetKey), { verdict });
      // Keep the game moving, like the desktop Studio: advance after the tap pulse.
      window.setTimeout(() => navNextRef.current(), 200);
    },
    [day, currentFacetKey, commit],
  );

  const handleNoteSave = useCallback(
    (draft: NoteDraft) => {
      if (!day || !noteContext) return;
      // Target the unit the sheet was opened for, not wherever the cursor is now.
      const target =
        noteContext.kind === 'day' ? dayTarget(day) : facetTarget(day, noteContext.facet);
      commit(target, draft);
      setNoteContext(null);
    },
    [day, noteContext, commit],
  );

  const handleImport = useCallback((merged: Judgment[]) => {
    replaceLocal(merged);
    setJudgments(merged);
  }, []);

  // ---- Note sheet seed ------------------------------------------------------

  const noteSeed = useMemo(() => {
    if (!day || !noteContext) {
      return { note: '', tags: [] as JudgmentTag[], suggestion: '' };
    }
    const target =
      noteContext.kind === 'day' ? dayTarget(day) : facetTarget(day, noteContext.facet);
    const existing = latest.get(targetId(target));
    return {
      verdict: existing?.verdict,
      note: existing?.note ?? '',
      tags: existing?.tags ?? [],
      severity: existing?.severity,
      suggestion: existing?.suggestion ?? '',
    };
  }, [day, noteContext, latest]);

  const noteLabel = !day
    ? ''
    : noteContext?.kind === 'day'
      ? `Whole day · ${day.theme}`
      : `${FACET_LABELS[currentFacetKey]} · ${day.theme}`;

  // ---- Render ---------------------------------------------------------------

  const showEmpty = !loading && !error && days.length === 0;

  return (
    <div className="fixed inset-0 flex flex-col bg-night text-ink">
      <DayPicker
        theme={day?.theme ?? '…'}
        dayNumber={day?.index ?? dayIndex + 1}
        status={day?.status}
        facetIndex={facetIndex}
        facetVerdicts={facetVerdicts}
        dayVerdict={dayVerdict}
        mode={mode}
        pendingCount={opinionCount}
        canPrevDay={dayIndex > 0}
        canNextDay={dayIndex < days.length - 1}
        onPrevDay={prevDay}
        onNextDay={nextDay}
        onSelectFacet={selectFacet}
        onJudgeDay={() => day && setNoteContext({ kind: 'day' })}
        onOpenSync={() =>
          mode === 'local' ? setSyncOpen(true) : setToast('Live — saved to the ledger.')
        }
      />

      <div ref={elementRef} className="min-h-0 flex-1 will-change-transform" {...handlers}>
        {loading ? (
          <CardSkeleton />
        ) : error ? (
          <FullState
            title="Could not load"
            message={error}
            action={{ label: 'Try again', onClick: init }}
          />
        ) : showEmpty ? (
          <FullState
            title="Nothing to review"
            message="No days are available yet. Publish a day, or run the studio against the dev server to review drafts."
          />
        ) : currentFacet ? (
          <FacetCard
            key={`${day?.slug}-${currentFacetKey}`}
            facet={currentFacet}
            enterFrom={enterFrom}
            scrollRef={scrollRef}
            verdict={currentVerdict}
          />
        ) : (
          <CardSkeleton />
        )}
      </div>

      <VerdictBar
        verdict={currentVerdict}
        hasDetail={currentHasDetail}
        disabled={!currentFacet}
        onVerdict={handleVerdict}
        onOpenNote={() => day && setNoteContext({ kind: 'facet', facet: currentFacetKey })}
      />

      <NoteSheet
        open={noteContext !== null}
        targetLabel={noteLabel}
        initial={noteSeed}
        onClose={() => setNoteContext(null)}
        onSave={handleNoteSave}
      />

      <SyncSheet
        open={syncOpen}
        judgments={judgments}
        onClose={() => setSyncOpen(false)}
        onImport={handleImport}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4"
        >
          <p className="rounded-full border border-night-raised bg-night-soft/95 px-4 py-2 font-sans text-xs text-ink backdrop-blur-sm">
            {toast}
          </p>
        </div>
      ) : null}
    </div>
  );
}
