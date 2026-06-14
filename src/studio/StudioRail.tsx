import { useEffect, useRef } from 'react';
import type { Judgment, Verdict } from '@/content/judgments';
import type { FeedItem } from './feed';

// The dot color for a card's current verdict; unjudged cards stay hollow. Mirrors
// the card's VERDICT_STYLE hues so the rail reads as the same vocabulary.
const VERDICT_DOT: Record<Verdict, string> = {
  keep: 'bg-emerald-400',
  flat: 'bg-ink-faint',
  fix: 'bg-ember',
  cut: 'bg-rose-400',
};

export interface StudioRailProps {
  feed: FeedItem[];
  focusIndex: number;
  latest: Map<string, Judgment>;
  onJump: (index: number) => void;
}

// A thin vertical rail: one dot per card in the lens, colored by its current
// verdict, with the focused card marked. It gives mouse users a way to jump and
// everyone a sense of position and progress without rendering every card.
export function StudioRail({ feed, focusIndex, latest, onJump }: StudioRailProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the focused dot in view as the reader moves through a long lens.
  useEffect(() => {
    const dot = ref.current?.querySelector<HTMLElement>(`[data-rail-index="${focusIndex}"]`);
    dot?.scrollIntoView?.({ block: 'nearest' });
  }, [focusIndex]);

  return (
    <nav
      ref={ref}
      aria-label="Review cards in this lens"
      className="hidden max-h-[calc(100vh-2rem)] flex-col gap-1 overflow-y-auto py-1 pr-1 lg:flex"
    >
      {feed.map((item, i) => {
        const current = latest.get(item.id);
        const focused = i === focusIndex;
        return (
          <button
            key={item.id}
            data-rail-index={i}
            type="button"
            aria-current={focused ? 'true' : undefined}
            title={`${item.kicker}: ${item.heading}`}
            onClick={() => onJump(i)}
            className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
              focused ? 'border-ember' : 'border-transparent hover:border-night-raised'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                current ? VERDICT_DOT[current.verdict] : 'border border-ink-faint'
              }`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </nav>
  );
}
