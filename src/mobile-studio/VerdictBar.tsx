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

// The game's core control, floated over the reading area so the card can run nearly
// full-screen. One tap is a full judgment; the Note button opens the detail sheet.
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-ink-faint/20 bg-night/85 px-1.5 py-1 shadow-lg shadow-black/40 backdrop-blur-md">
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
                'flex h-11 w-12 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-150 disabled:opacity-30',
                active ? `bg-ink/[0.07] ${meta.color}` : 'text-ink-faint active:text-ink',
              ].join(' ')}
            >
              <span className={['text-lg leading-none', popping ? 'reaction-pop' : ''].join(' ')}>
                {meta.glyph}
              </span>
              <span className="font-sans text-[0.6rem] uppercase tracking-widest2">
                {meta.label}
              </span>
            </button>
          );
        })}

        <div className="mx-0.5 h-6 w-px bg-ink-faint/15" aria-hidden="true" />

        {/* Note / detail */}
        <button
          type="button"
          disabled={disabled}
          onClick={onOpenNote}
          aria-label={hasDetail ? 'Edit note and detail' : 'Add note and detail'}
          className={[
            'relative flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-150 disabled:opacity-30',
            hasDetail ? 'text-ember' : 'text-ink-faint active:text-ink',
          ].join(' ')}
        >
          <span className="text-lg leading-none">✎</span>
          <span className="font-sans text-[0.6rem] uppercase tracking-widest2">Note</span>
          {hasDetail ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-ember" />
          ) : null}
        </button>
      </div>
    </div>
  );
}
