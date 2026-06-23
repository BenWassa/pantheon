import { useState } from 'react';
import type { MobileReactionType } from './types';

interface ReactionBarProps {
  reaction: MobileReactionType | undefined;
  commentCount: number;
  canPrev: boolean;
  canNext: boolean;
  onReact: (r: MobileReactionType) => void;
  onOpenComments: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const REACTIONS: { type: MobileReactionType; label: string; icon: string }[] = [
  { type: 'love', label: 'Love', icon: '♥' },
  { type: 'save', label: 'Save', icon: '◈' },
  { type: 'skip', label: 'Skip', icon: '›' },
];

export function ReactionBar({
  reaction,
  commentCount,
  canPrev,
  canNext,
  onReact,
  onOpenComments,
  onPrev,
  onNext,
}: ReactionBarProps) {
  const [popKey, setPopKey] = useState<MobileReactionType | null>(null);

  function handleReact(type: MobileReactionType) {
    navigator.vibrate?.([8]);
    setPopKey(type);
    onReact(type);
    // Clear pop class after animation.
    setTimeout(() => setPopKey(null), 320);
  }

  return (
    <div className="flex items-stretch border-t border-night-raised bg-night pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Prev nav */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous facet"
        className="flex w-12 items-center justify-center text-ink-faint transition-colors disabled:opacity-20 active:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Reaction buttons */}
      {REACTIONS.map(({ type, label, icon }) => {
        const active = reaction === type;
        const popping = popKey === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleReact(type)}
            aria-label={`${label} this facet`}
            aria-pressed={active}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-3 transition-colors',
              active ? 'text-ember' : 'text-ink-faint active:text-ink',
            ].join(' ')}
          >
            <span className={['text-xl leading-none', popping ? 'reaction-pop' : ''].join(' ')}>
              {icon}
            </span>
            <span className="font-sans text-[0.6rem] uppercase tracking-widest2">{label}</span>
          </button>
        );
      })}

      {/* Comment button */}
      <button
        type="button"
        onClick={onOpenComments}
        aria-label={`Notes${commentCount > 0 ? ` (${commentCount})` : ''}`}
        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-ink-faint transition-colors active:text-ink"
      >
        <span className="text-xl leading-none">✦</span>
        <span className="font-sans text-[0.6rem] uppercase tracking-widest2">Notes</span>
        {commentCount > 0 && (
          <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-ember font-sans text-[0.55rem] text-night">
            {commentCount > 9 ? '9+' : commentCount}
          </span>
        )}
      </button>

      {/* Next nav */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next facet"
        className="flex w-12 items-center justify-center text-ink-faint transition-colors disabled:opacity-20 active:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
