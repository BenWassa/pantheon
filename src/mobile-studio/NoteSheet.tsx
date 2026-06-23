import { useEffect, useRef, useState } from 'react';
import {
  JUDGMENT_TAGS,
  SEVERITIES,
  TAG_LABELS,
  VERDICTS,
  type JudgmentTag,
  type Severity,
  type Verdict,
} from '@/content/judgments';
import { VERDICT_META } from './verdictMeta';

export interface NoteDraft {
  verdict: Verdict;
  note: string;
  tags: JudgmentTag[];
  severity?: Severity;
  suggestion: string;
}

interface NoteSheetProps {
  open: boolean;
  targetLabel: string;
  initial: {
    verdict?: Verdict;
    note: string;
    tags: JudgmentTag[];
    severity?: Severity;
    suggestion: string;
  };
  onClose: () => void;
  onSave: (draft: NoteDraft) => void;
}

// The detail editor for one target: a full judgment in one quick sheet. Verdict
// chips up top (the only required field), a note as the primary input, and an
// expandable "detail" block for tags, severity, and a suggested rewrite. Seeded
// from any existing judgment, so re-opening is an edit, not a blank restart.
export function NoteSheet({ open, targetLabel, initial, onClose, onSave }: NoteSheetProps) {
  const [verdict, setVerdict] = useState<Verdict | undefined>(initial.verdict);
  const [note, setNote] = useState(initial.note);
  const [tags, setTags] = useState<JudgmentTag[]>(initial.tags);
  const [severity, setSeverity] = useState<Severity | undefined>(initial.severity);
  const [suggestion, setSuggestion] = useState(initial.suggestion);
  const [detailOpen, setDetailOpen] = useState(
    initial.tags.length > 0 || !!initial.severity || initial.suggestion.length > 0,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Re-seed every time the sheet opens (the focused target may have changed).
  useEffect(() => {
    if (!open) return;
    setVerdict(initial.verdict);
    setNote(initial.note);
    setTags(initial.tags);
    setSeverity(initial.severity);
    setSuggestion(initial.suggestion);
    setDetailOpen(initial.tags.length > 0 || !!initial.severity || initial.suggestion.length > 0);
    const id = setTimeout(() => textareaRef.current?.focus(), 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the sheet above the soft keyboard.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    function handleResize() {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const offset = window.innerHeight - (vv?.height ?? window.innerHeight) - (vv?.offsetTop ?? 0);
      sheet.style.bottom = offset > 0 ? `${offset}px` : '';
    }
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [open]);

  if (!open) return null;

  function toggleTag(tag: JudgmentTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleSave() {
    if (!verdict) return;
    onSave({
      verdict,
      note: note.trim(),
      tags,
      severity: verdict === 'keep' ? undefined : severity,
      suggestion: suggestion.trim(),
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Judge ${targetLabel}`}
        className="sheet-rise fixed bottom-0 left-0 right-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-night-raised bg-night-soft pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-night-raised" />

        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div className="min-w-0">
            <p className="truncate font-display text-base text-ink">{targetLabel}</p>
            <p className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint">
              Your judgment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-night-raised text-ink-faint active:text-ink"
          >
            ✕
          </button>
        </div>

        {/* Verdict chips — the one required field. */}
        <div className="flex gap-2 px-5 pb-3 pt-1">
          {VERDICTS.map((v) => {
            const meta = VERDICT_META[v];
            const active = verdict === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVerdict(v)}
                aria-pressed={active}
                className={[
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-2 transition-colors',
                  active
                    ? `border-current ${meta.color}`
                    : 'border-night-raised text-ink-faint active:text-ink',
                ].join(' ')}
              >
                <span className="text-lg leading-none">{meta.glyph}</span>
                <span className="font-sans text-[0.55rem] uppercase tracking-widest2">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Note */}
        <div className="px-4">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What strikes you — alive, flat, off, why…"
            rows={3}
            className="w-full resize-none rounded-xl border border-night-raised bg-night px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
          />
        </div>

        {/* Detail expander */}
        <button
          type="button"
          onClick={() => setDetailOpen((o) => !o)}
          aria-expanded={detailOpen}
          className="mt-2 flex items-center gap-1.5 px-5 font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint active:text-ink"
        >
          {detailOpen ? '▾' : '▸'} Add detail
        </button>

        {detailOpen ? (
          <div className="space-y-4 px-5 pb-2 pt-3">
            {/* Tags */}
            <div>
              <p className="mb-2 font-sans text-[0.55rem] uppercase tracking-widest2 text-ink-faint">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {JUDGMENT_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={[
                        'rounded-full border px-2.5 py-1 font-sans text-[0.65rem] transition-colors',
                        active
                          ? 'border-ember text-ember'
                          : 'border-night-raised text-ink-faint active:text-ink',
                      ].join(' ')}
                    >
                      {TAG_LABELS[tag]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity — only meaningful for a negative verdict. */}
            {verdict && verdict !== 'keep' ? (
              <div>
                <p className="mb-2 font-sans text-[0.55rem] uppercase tracking-widest2 text-ink-faint">
                  Severity
                </p>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => {
                    const active = severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(active ? undefined : s)}
                        aria-pressed={active}
                        className={[
                          'rounded-full border px-3 py-1 font-sans text-[0.65rem] capitalize transition-colors',
                          active
                            ? 'border-ember text-ember'
                            : 'border-night-raised text-ink-faint active:text-ink',
                        ].join(' ')}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Suggestion */}
            <div>
              <p className="mb-2 font-sans text-[0.55rem] uppercase tracking-widest2 text-ink-faint">
                Suggested rewrite
              </p>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="A better version, if one comes to mind…"
                rows={2}
                className="w-full resize-none rounded-xl border border-night-raised bg-night px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
              />
            </div>
          </div>
        ) : null}

        {/* Save */}
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!verdict}
            className="w-full rounded-xl bg-ember py-3 font-sans text-xs uppercase tracking-widest2 text-night transition-opacity disabled:opacity-30"
          >
            {verdict ? `Save · ${VERDICT_META[verdict].label}` : 'Choose a verdict'}
          </button>
        </div>
      </div>
    </>
  );
}
