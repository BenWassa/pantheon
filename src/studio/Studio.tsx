import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Day } from '@/content/types';
import {
  type Judgment,
  type JudgmentTag,
  type Severity,
  SEVERITIES,
  type Verdict,
  VERDICT_KEYS,
  VERDICT_LABELS,
  latestByTarget,
  makeJudgmentId,
  rollup,
} from '@/content/judgments';
import { deleteJudgment, fetchDays, fetchJudgments, postJudgment } from './api';
import { type Lens, LENSES, LENS_HINT, LENS_LABELS, buildFeed } from './feed';
import { StudioCard } from './StudioCard';
import { StudioRail } from './StudioRail';

type StatusFilter = 'all' | 'unpublished';
type ReviewFilter = 'all' | 'needsReview';

export function Studio() {
  const [days, setDays] = useState<Day[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [lens, setLens] = useState<Lens>('day');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [focusIndex, setFocusIndex] = useState(0);
  const [draftTags, setDraftTags] = useState<JudgmentTag[]>([]);
  const [draftNote, setDraftNote] = useState('');
  const [draftSuggestion, setDraftSuggestion] = useState('');
  const [draftSeverity, setDraftSeverity] = useState<Severity | undefined>(undefined);
  const [echoId, setEchoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [d, j] = await Promise.all([fetchDays(), fetchJudgments()]);
        setDays(d);
        setJudgments(j);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredDays = useMemo(
    () => (statusFilter === 'unpublished' ? days.filter((d) => d.status !== 'published') : days),
    [days, statusFilter],
  );

  const rawFeed = useMemo(() => buildFeed(filteredDays, lens), [filteredDays, lens]);
  const latest = useMemo(() => latestByTarget(judgments), [judgments]);
  const totals = useMemo(() => rollup([...latest.values()]), [latest]);
  const feed = useMemo(
    () => (reviewFilter === 'needsReview' ? rawFeed.filter((i) => !latest.has(i.id)) : rawFeed),
    [rawFeed, latest, reviewFilter],
  );

  // Keep focus inside the feed as the lens or filter changes its length.
  useEffect(() => {
    setFocusIndex((i) => Math.min(i, Math.max(0, feed.length - 1)));
  }, [feed.length]);

  const focusedItem = feed[focusIndex];
  const focusedCurrent = focusedItem ? latest.get(focusedItem.id) : undefined;

  // When focus lands on a new card, seed the draft from any existing judgment so
  // re-judging is an edit, not a blank restart.
  useEffect(() => {
    setDraftTags(focusedCurrent?.tags ?? []);
    setDraftNote(focusedCurrent?.note ?? '');
    setDraftSuggestion(focusedCurrent?.suggestion ?? '');
    setDraftSeverity(focusedCurrent?.severity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedItem?.id]);

  const reviewedInLens = useMemo(
    () => rawFeed.filter((i) => latest.has(i.id)).length,
    [rawFeed, latest],
  );
  const unreviewedInLens = rawFeed.length - reviewedInLens;
  const reviewedPercent =
    rawFeed.length === 0 ? 0 : Math.round((reviewedInLens / rawFeed.length) * 100);

  const applyVerdict = useCallback(
    async (verdict: Verdict) => {
      const item = feed[focusIndex];
      if (!item) return;
      const judgment: Judgment = {
        id: makeJudgmentId(),
        at: new Date().toISOString(),
        target: item.target,
        verdict,
        tags: draftTags,
        note: draftNote.trim() || undefined,
        // Severity only sharpens a negative verdict; never attach it to a keep.
        severity: verdict === 'keep' ? undefined : draftSeverity,
        suggestion: draftSuggestion.trim() || undefined,
      };
      setJudgments((prev) => [...prev, judgment]); // optimistic
      setEchoId(item.id); // pulse the verdict so fast keying still gives feedback
      setFocusIndex((i) => (reviewFilter === 'needsReview' ? i : Math.min(i + 1, feed.length - 1))); // keep moving
      try {
        await postJudgment(judgment);
      } catch (e) {
        setJudgments((prev) => prev.filter((j) => j.id !== judgment.id));
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [feed, focusIndex, draftTags, draftNote, draftSuggestion, draftSeverity, reviewFilter],
  );

  // Clear the verdict echo a beat after it fires.
  useEffect(() => {
    if (echoId === null) return;
    const t = setTimeout(() => setEchoId(null), 350);
    return () => clearTimeout(t);
  }, [echoId]);

  const undo = useCallback(async () => {
    const item = feed[focusIndex];
    if (!item) return;
    const current = latest.get(item.id);
    if (!current) return;
    setJudgments((prev) => prev.filter((j) => j.id !== current.id)); // optimistic
    try {
      await deleteJudgment(current.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // Reload to resync if the delete failed.
      try {
        setJudgments(await fetchJudgments());
      } catch {
        // leave optimistic state; the error banner already shows
      }
    }
  }, [feed, focusIndex, latest]);

  const toggleTag = useCallback((tag: JudgmentTag) => {
    setDraftTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  // Cycle severity through none -> minor -> major -> none, in either direction.
  const cycleSeverity = useCallback((dir: 1 | -1) => {
    const order: (Severity | undefined)[] = [undefined, ...SEVERITIES];
    setDraftSeverity((cur) => {
      const i = order.indexOf(cur);
      return order[(i + dir + order.length) % order.length];
    });
  }, []);

  // Jump to the next/previous card with no current judgment, wrapping around.
  const jumpToGap = useCallback(
    (dir: 1 | -1) => {
      if (feed.length === 0) return;
      for (let step = 1; step <= feed.length; step += 1) {
        const i = (focusIndex + dir * step + feed.length * step) % feed.length;
        const item = feed[i];
        if (item && !latest.has(item.id)) {
          setFocusIndex(i);
          return;
        }
      }
    },
    [feed, focusIndex, latest],
  );

  // Focus a draft textarea by its data attribute (suggestion hotkey).
  const cardRef = useRef<HTMLDivElement>(null);
  const focusField = useCallback((attr: string) => {
    const el = cardRef.current?.querySelector<HTMLTextAreaElement>(`[${attr}]`);
    el?.focus();
  }, []);

  // Global hotkeys. Typing in a field is exempt so prose can contain digits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) {
        if (e.key === 'Escape') el.blur();
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, feed.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'n') {
        e.preventDefault();
        jumpToGap(1);
      } else if (e.key === 'b') {
        e.preventDefault();
        jumpToGap(-1);
      } else if (e.key === 'g') {
        setLens((l) => LENSES[(LENSES.indexOf(l) + 1) % LENSES.length]!);
      } else if (e.key === '[') {
        cycleSeverity(-1);
      } else if (e.key === ']') {
        cycleSeverity(1);
      } else if (e.key === 's') {
        e.preventDefault();
        focusField('data-studio-suggestion');
      } else if (e.key === 'u') {
        void undo();
      } else if (VERDICT_KEYS[e.key]) {
        void applyVerdict(VERDICT_KEYS[e.key]!);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feed.length, applyVerdict, undo, jumpToGap, cycleSeverity, focusField]);

  if (loading) return <Centered>Loading the corpus…</Centered>;
  if (error && !days.length) return <Centered>Studio API error: {error}</Centered>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-night-raised bg-night/90 px-4 pb-3 pt-2 backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-lg text-ink">
            Pantheon <span className="text-ember">Studio</span>
          </h1>
          <p className="text-xs text-ink-faint">
            {feed.length === 0 ? 0 : focusIndex + 1}/{feed.length} · {reviewedInLens}/
            {rawFeed.length} reviewed
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {LENSES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLens(l)}
              className={`rounded border px-2.5 py-1 text-xs ${
                l === lens
                  ? 'border-ember/60 text-ember'
                  : 'border-night-raised text-ink-muted hover:text-ink'
              }`}
            >
              {LENS_LABELS[l]}
            </button>
          ))}
          <span className="text-[0.7rem] text-ink-faint">press g to cycle</span>

          <button
            type="button"
            onClick={() => setStatusFilter((s) => (s === 'all' ? 'unpublished' : 'all'))}
            className="ml-auto rounded border border-night-raised px-2.5 py-1 text-xs text-ink-muted hover:text-ink"
          >
            {statusFilter === 'all' ? 'All statuses' : 'Unpublished only'}
          </button>

          <button
            type="button"
            onClick={() => setReviewFilter((s) => (s === 'all' ? 'needsReview' : 'all'))}
            className={`rounded border px-2.5 py-1 text-xs ${
              reviewFilter === 'needsReview'
                ? 'border-ember/60 text-ember'
                : 'border-night-raised text-ink-muted hover:text-ink'
            }`}
          >
            {reviewFilter === 'all' ? 'All cards' : 'Needs review'}
          </button>
        </div>

        <p className="mt-2 text-[0.7rem] text-ink-faint">{LENS_HINT[lens]}</p>

        {/* HUD: in-flow signal summary for the current corpus, without the report. */}
        <div className="mt-3 grid gap-2 rounded border border-night-raised bg-night-soft px-3 py-2 text-xs text-ink-muted sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <span className="text-ink">{reviewedPercent}%</span> current-lens coverage
            <span className="text-ink-faint"> · {unreviewedInLens} still unjudged</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-night sm:w-40">
            <div
              className="h-full rounded-full bg-ember"
              style={{ width: `${reviewedPercent}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="text-[0.7rem] text-ink-faint sm:col-span-2">
            {(['keep', 'flat', 'fix', 'cut'] as Verdict[])
              .map((v) => `${VERDICT_LABELS[v]} ${totals.byVerdict[v]}`)
              .join('  ·  ')}
            {'  ·  '}
            <span title="negative verdicts rated by severity">
              major {totals.bySeverity.major} / minor {totals.bySeverity.minor}
            </span>
            {'  ·  '}
            <span title="judgments carrying a suggested rewrite">
              {totals.withSuggestion} suggestion{totals.withSuggestion === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mb-3 rounded border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      ) : null}

      {feed.length === 0 ? (
        <Centered>
          {reviewFilter === 'needsReview'
            ? 'Everything in this lens has a current judgment.'
            : 'No content matches this filter.'}
        </Centered>
      ) : (
        <div className="flex gap-3">
          <StudioRail
            feed={feed}
            focusIndex={focusIndex}
            latest={latest}
            onJump={(i) => setFocusIndex(i)}
          />

          <div className="min-w-0 flex-1">
            {focusedItem ? (
              <div ref={cardRef}>
                <StudioCard
                  key={focusedItem.id}
                  item={focusedItem}
                  focused
                  current={focusedCurrent}
                  draftTags={draftTags}
                  draftNote={draftNote}
                  draftSuggestion={draftSuggestion}
                  draftSeverity={draftSeverity}
                  echo={echoId === focusedItem.id}
                  onFocus={() => undefined}
                  onVerdict={(v) => void applyVerdict(v)}
                  onToggleTag={toggleTag}
                  onNote={setDraftNote}
                  onSuggestion={setDraftSuggestion}
                  onSeverity={setDraftSeverity}
                  onUndo={() => void undo()}
                />
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between text-[0.7rem] text-ink-faint">
              <button
                type="button"
                onClick={() => setFocusIndex((i) => Math.max(i - 1, 0))}
                disabled={focusIndex === 0}
                className="rounded border border-night-raised px-2 py-1 hover:text-ink disabled:opacity-40"
              >
                ← prev (k)
              </button>
              <span>{feed[focusIndex]?.kicker}</span>
              <button
                type="button"
                onClick={() => setFocusIndex((i) => Math.min(i + 1, feed.length - 1))}
                disabled={focusIndex >= feed.length - 1}
                className="rounded border border-night-raised px-2 py-1 hover:text-ink disabled:opacity-40"
              >
                next (j) →
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-center text-[0.7rem] text-ink-faint">
        j/k move · n/b next gap · 1–4 verdict · [ ] severity · s suggest · g lens · u undo · run{' '}
        <code className="text-ink-muted">npm run studio:report</code> to turn judgments into a
        revision queue
      </footer>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-ink-muted">
      {children}
    </div>
  );
}
