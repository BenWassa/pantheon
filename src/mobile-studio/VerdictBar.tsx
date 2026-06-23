import { useState } from 'react';
import { VERDICTS, type Verdict } from '@/content/judgments';
import { VERDICT_META } from './verdictMeta';

interface VerdictBarProps {
  verdict: Verdict | undefined;
  /** Whether the focused target carries a note / tags / suggestion. */
  hasDetail: boolean;
  disabled: boolean;
  onVerdict: (verdict: Verdict) => void;
  onOpenNote: () => void;
}

// The game's core control: one tap is a full judgment. Four verdicts, big targets,
// a haptic tick. The Notes button opens the detail sheet for the same target.
export function VerdictBar({
  verdict,
  hasDetail,
  disabled,
  onVerdict,
  onOpenNote,
}: VerdictBarProps) {
  const [popKey, setPopKey] = useState<Verdict | null>(null);

  function handle(v: Verdict) {
    if (disabled) return;
    navigator.vibrate?.(8);
    setPopKey(v);
    onVerdict(v);
    setTimeout(() => setPopKey(null), 320);
  }

  return (
    <div className="flex items-stretch border-t border-night-raised bg-night pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {VERDICTS.map((v) => {
        const meta = VERDICT_META[v];
        const active = verdict === v;
        const popping = popKey === v;
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => handle(v)}
            aria-label={`${meta.label}: ${meta.hint}`}
            aria-pressed={active}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors disabled:opacity-30',
              active ? meta.color : 'text-ink-faint active:text-ink',
            ].join(' ')}
          >
            <span className={['text-2xl leading-none', popping ? 'reaction-pop' : ''].join(' ')}>
              {meta.glyph}
            </span>
            <span className="font-sans text-[0.6rem] uppercase tracking-widest2">{meta.label}</span>
          </button>
        );
      })}

      {/* Notes / detail */}
      <button
        type="button"
        disabled={disabled}
        onClick={onOpenNote}
        aria-label={hasDetail ? 'Edit note and detail' : 'Add note and detail'}
        className="relative flex w-16 flex-col items-center justify-center gap-1 border-l border-night-raised py-3 text-ink-faint transition-colors active:text-ink disabled:opacity-30"
      >
        <span className="text-2xl leading-none">✎</span>
        <span className="font-sans text-[0.6rem] uppercase tracking-widest2">Note</span>
        {hasDetail ? (
          <span className="absolute right-3 top-2.5 h-1.5 w-1.5 rounded-full bg-ember" />
        ) : null}
      </button>
    </div>
  );
}
