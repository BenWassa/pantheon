import { FACET_ORDER } from '@/content/types';
import type { FacetKey } from '@/content/types';

interface DayPickerProps {
  theme: string;
  dayNumber: number;
  facetIndex: number;
  visitedFacets: Set<FacetKey>;
  canPrev: boolean;
  canNext: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export function DayPicker({
  theme,
  dayNumber,
  facetIndex,
  visitedFacets,
  canPrev,
  canNext,
  onPrevDay,
  onNextDay,
}: DayPickerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onPrevDay}
        disabled={!canPrev}
        aria-label="Previous day"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-night-raised text-ink-faint transition-colors disabled:opacity-25 active:bg-night-raised"
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

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <p className="truncate font-display text-sm uppercase tracking-widest2 text-ink">{theme}</p>
        <div
          className="flex items-center gap-1.5"
          aria-label={`Day ${dayNumber}, facet ${facetIndex + 1} of 6`}
        >
          {FACET_ORDER.map((key, i) => {
            const isCurrent = i === facetIndex;
            const isVisited = visitedFacets.has(key);
            return (
              <span
                key={key}
                className={[
                  'h-1.5 rounded-full transition-all duration-200',
                  isCurrent
                    ? 'w-4 bg-ember'
                    : isVisited
                      ? 'w-1.5 bg-ink-faint'
                      : 'w-1.5 border border-night-raised bg-transparent',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onNextDay}
        disabled={!canNext}
        aria-label="Next day"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-night-raised text-ink-faint transition-colors disabled:opacity-25 active:bg-night-raised"
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
