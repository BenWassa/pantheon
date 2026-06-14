import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from 'react';
import {
  JUDGMENT_TAGS,
  type Judgment,
  type JudgmentTag,
  type Severity,
  SEVERITIES,
  SEVERITY_LABELS,
  type Verdict,
  TAG_LABELS,
  VERDICTS,
  VERDICT_LABELS,
} from '@/content/judgments';
import type { FeedItem } from './feed';

const VERDICT_STYLE: Record<Verdict, string> = {
  keep: 'border-emerald-700/60 text-emerald-300',
  flat: 'border-ink-faint text-ink-muted',
  fix: 'border-ember/60 text-ember',
  cut: 'border-rose-800/60 text-rose-300',
};

function StatusBadge({ status }: { status: FeedItem['status'] }) {
  const published = status === 'published';
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[0.6rem] uppercase tracking-widest2 ${
        published ? 'text-ink-faint' : 'text-ember'
      }`}
    >
      {status}
    </span>
  );
}

export interface StudioCardProps {
  item: FeedItem;
  focused: boolean;
  current?: Judgment; // the latest verdict recorded for this target
  draftTags: JudgmentTag[];
  draftNote: string;
  draftSuggestion: string;
  draftSeverity?: Severity; // the severity to attach to the next negative verdict
  echo?: boolean; // pulse the just-recorded verdict for fast-keying feedback
  onFocus: () => void;
  onVerdict: (verdict: Verdict) => void;
  onToggleTag: (tag: JudgmentTag) => void;
  onNote: (note: string) => void;
  onSuggestion: (suggestion: string) => void;
  onSeverity: (severity: Severity | undefined) => void;
  onUndo: () => void;
}

export function StudioCard({
  item,
  focused,
  current,
  draftTags,
  draftNote,
  draftSuggestion,
  draftSeverity,
  echo,
  onFocus,
  onVerdict,
  onToggleTag,
  onNote,
  onSuggestion,
  onSeverity,
  onUndo,
}: StudioCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the focused card in view as the reader moves through the feed.
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [focused]);

  // Click-to-focus is only on cards that are not already focused, so the focused
  // card (which holds the verdict buttons) never nests interactive controls inside
  // a button-role container.
  const focusProps = focused
    ? {}
    : {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': `Review ${item.kicker}: ${item.heading}`,
        onClick: onFocus,
        onKeyDown: (e: ReactKeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFocus();
          }
        },
      };

  return (
    <div
      ref={ref}
      {...focusProps}
      className={`rounded-lg border px-5 py-4 transition-colors ${
        focused
          ? 'border-ember/50 bg-night-raised'
          : 'cursor-pointer border-night-raised bg-night-soft hover:border-ink-faint'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] uppercase tracking-widest2 text-ember">{item.kicker}</p>
        <div className="flex items-center gap-2">
          {current ? (
            <span
              className={`rounded border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-widest2 ${VERDICT_STYLE[current.verdict]} ${echo ? 'animate-pulse' : ''}`}
            >
              {VERDICT_LABELS[current.verdict]}
              {current.severity ? ` · ${current.severity}` : ''}
            </span>
          ) : null}
          <StatusBadge status={item.status} />
        </div>
      </div>

      <h2 className="mt-2 font-display text-xl leading-snug text-ink">{item.heading}</h2>

      {item.body ? (
        <p className="mt-2 whitespace-pre-line font-body text-[0.95rem] leading-relaxed text-ink-muted">
          {item.body}
        </p>
      ) : null}

      {item.context ? (
        <p className="mt-2 whitespace-pre-line text-sm italic text-ink-faint">{item.context}</p>
      ) : null}

      {item.meta.length ? (
        <p className="mt-2 text-[0.7rem] text-ink-faint">{item.meta.join('  ·  ')}</p>
      ) : null}

      {focused ? (
        <div className="mt-4 border-t border-night-raised pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {VERDICTS.map((verdict, i) => (
              <button
                key={verdict}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerdict(verdict);
                }}
                className={`rounded border px-3 py-1 text-sm hover:bg-night ${VERDICT_STYLE[verdict]}`}
              >
                <span className="text-ink-faint">{i + 1}</span> {VERDICT_LABELS[verdict]}
              </button>
            ))}
            {current ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                className="ml-auto rounded border border-night-raised px-3 py-1 text-sm text-ink-muted hover:text-ink"
              >
                Undo (u)
              </button>
            ) : null}
          </div>

          {/* Severity refines a negative verdict; it is optional and off by default. */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-faint">Severity</span>
            {SEVERITIES.map((sev) => {
              const on = draftSeverity === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeverity(on ? undefined : sev);
                  }}
                  className={`rounded border px-2 py-0.5 ${
                    on
                      ? 'border-ember bg-ember/10 text-ember'
                      : 'border-night-raised text-ink-faint hover:text-ink-muted'
                  }`}
                >
                  {SEVERITY_LABELS[sev]}
                </button>
              );
            })}
            <span className="text-[0.65rem] text-ink-faint">[ ] to set</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {JUDGMENT_TAGS.map((tag) => {
              const on = draftTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTag(tag);
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    on
                      ? 'border-ember bg-ember/10 text-ember'
                      : 'border-night-raised text-ink-faint hover:text-ink-muted'
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>

          <textarea
            value={draftNote}
            onChange={(e) => onNote(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Optional note: what feels alive, flat, or untrustworthy here."
            rows={2}
            data-studio-note
            className="mt-3 w-full resize-y rounded border border-night-raised bg-night px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
          />

          <textarea
            value={draftSuggestion}
            onChange={(e) => onSuggestion(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Suggested rewrite (s): the version you'd ship instead. Carried into the report."
            rows={2}
            data-studio-suggestion
            className="mt-2 w-full resize-y rounded border border-night-raised bg-night px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
          />

          {current?.note ? (
            <p className="mt-2 text-xs text-ink-faint">Last note: {current.note}</p>
          ) : null}
          {current?.suggestion ? (
            <p className="mt-1 text-xs text-ink-faint">Last suggestion: {current.suggestion}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
