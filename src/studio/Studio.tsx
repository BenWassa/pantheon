import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { Day } from '@/content/types';
import {
  type Judgment,
  type JudgmentTag,
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

type StatusFilter = 'all' | 'unpublished';

export function Studio() {
  const [days, setDays] = useState<Day[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [lens, setLens] = useState<Lens>('day');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [focusIndex, setFocusIndex] = useState(0);
  const [draftTags, setDraftTags] = useState<JudgmentTag[]>([]);
  const [draftNote, setDraftNote] = useState('');
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

  const feed = useMemo(() => buildFeed(filteredDays, lens), [filteredDays, lens]);
  const latest = useMemo(() => latestByTarget(judgments), [judgments]);
  const totals = useMemo(() => rollup([...latest.values()]), [latest]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedItem?.id]);

  const reviewedInLens = useMemo(() => feed.filter((i) => latest.has(i.id)).length, [feed, latest]);

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
      };
      setJudgments((prev) => [...prev, judgment]); // optimistic
      setFocusIndex((i) => Math.min(i + 1, feed.length - 1)); // keep moving
      try {
        await postJudgment(judgment);
      } catch (e) {
        setJudgments((prev) => prev.filter((j) => j.id !== judgment.id));
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [feed, focusIndex, draftTags, draftNote],
  );

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

  // Global hotkeys. Typing in the note field is exempt so prose can contain digits.
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
      } else if (e.key === 'g') {
        setLens((l) => LENSES[(LENSES.indexOf(l) + 1) % LENSES.length]!);
      } else if (e.key === 'u') {
        void undo();
      } else if (VERDICT_KEYS[e.key]) {
        void applyVerdict(VERDICT_KEYS[e.key]!);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feed.length, applyVerdict, undo]);

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
            {reviewedInLens}/{feed.length} reviewed in this lens
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
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem] text-ink-faint">
          <span>{LENS_HINT[lens]}</span>
          <span className="ml-auto">
            {(['keep', 'flat', 'fix', 'cut'] as Verdict[])
              .map((v) => `${VERDICT_LABELS[v]} ${totals.byVerdict[v]}`)
              .join('  ·  ')}
          </span>
        </div>
      </header>

      {error ? (
        <p className="mb-3 rounded border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      ) : null}

      {feed.length === 0 ? (
        <Centered>No content matches this filter.</Centered>
      ) : (
        <div className="space-y-3">
          {feed.map((item, i) => (
            <StudioCard
              key={item.id}
              item={item}
              focused={i === focusIndex}
              current={latest.get(item.id)}
              draftTags={i === focusIndex ? draftTags : (latest.get(item.id)?.tags ?? [])}
              draftNote={i === focusIndex ? draftNote : ''}
              onFocus={() => setFocusIndex(i)}
              onVerdict={(v) => void applyVerdict(v)}
              onToggleTag={toggleTag}
              onNote={setDraftNote}
              onUndo={() => void undo()}
            />
          ))}
        </div>
      )}

      <footer className="mt-8 text-center text-[0.7rem] text-ink-faint">
        j/k move · 1–4 verdict · g lens · u undo · run{' '}
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
