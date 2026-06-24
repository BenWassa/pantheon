import { FACET_ORDER, type DayStatus } from '@/content/types';
import type { Verdict } from '@/content/judgments';
import type { BackendMode } from './types';
import { VERDICT_BG, VERDICT_META } from './verdictMeta';

interface DayPickerProps {
  theme: string;
  dayNumber: number;
  status?: DayStatus;
  facetIndex: number;
  facetVerdicts: (Verdict | undefined)[];
  dayVerdict?: Verdict;
  mode: BackendMode;
  pendingCount: number;
  canPrevDay: boolean;
  canNextDay: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectFacet: (index: number) => void;
  onJudgeDay: () => void;
  onOpenSync: () => void;
}

const STATUS_LABEL: Record<DayStatus, string> = {
  draft: 'draft',
  review: 'review',
  ready: 'ready',
  published: 'live',
};

export function DayPicker({
  theme,
  dayNumber,
  status,
  facetIndex,
  facetVerdicts,
  dayVerdict,
  mode,
  pendingCount,
  canPrevDay,
  canNextDay,
  onPrevDay,
  onNextDay,
  onSelectFacet,
  onJudgeDay,
  onOpenSync,
}: DayPickerProps) {
  return (
    <header className="flex flex-col gap-2 bg-gradient-to-b from-night via-night/85 to-transparent px-4 pb-8 pt-[max(0.5rem,env(safe-area-inset-top))]">
      {/* Mode chip + status badge */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenSync}
          aria-label={
            mode === 'live'
              ? 'Live: judgments are saved to the ledger'
              : `Local: ${pendingCount} judgment${pendingCount === 1 ? '' : 's'} to sync`
          }
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-night-raised px-2.5 py-1 font-sans text-[0.625rem] uppercase tracking-widest2 text-ink-faint active:text-ink"
        >
          <span className={mode === 'live' ? 'text-verdict-keep' : 'text-ember'} aria-hidden="true">
            ●
          </span>
          {mode === 'live' ? 'Live' : `Local · ${pendingCount}`}
        </button>
        {status ? (
          <span className="font-sans text-[0.625rem] uppercase tracking-widest2 text-ink-faint">
            Day {dayNumber} · {STATUS_LABEL[status]}
          </span>
        ) : (
          <span className="font-sans text-[0.625rem] uppercase tracking-widest2 text-ink-faint">
            Day {dayNumber}
          </span>
        )}
      </div>

      {/* Day nav + theme (tap to judge the whole day) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevDay}
          disabled={!canPrevDay}
          aria-label="Previous day"
          className="pointer-events-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-night-raised text-ink-faint transition-colors disabled:opacity-25 active:bg-night-raised"
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

        <button
          type="button"
          onClick={onJudgeDay}
          aria-label={`Judge the whole day: ${theme}`}
          className="pointer-events-auto flex min-w-0 flex-1 items-center justify-center gap-2"
        >
          <span className="truncate font-display text-base uppercase tracking-widest2 text-ink">
            {theme}
          </span>
          {dayVerdict ? (
            <span aria-hidden="true" className={`text-xs ${VERDICT_META[dayVerdict].color}`}>
              {VERDICT_META[dayVerdict].glyph}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onNextDay}
          disabled={!canNextDay}
          aria-label="Next day"
          className="pointer-events-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-night-raised text-ink-faint transition-colors disabled:opacity-25 active:bg-night-raised"
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

      {/* Facet dots — tappable nav, colored by verdict. */}
      <div className="flex items-center justify-center gap-2">
        {FACET_ORDER.map((key, i) => {
          const isCurrent = i === facetIndex;
          const verdict = facetVerdicts[i];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectFacet(i)}
              aria-label={`Go to facet ${i + 1} of 6${verdict ? `, ${verdict}` : ''}`}
              aria-current={isCurrent}
              className="pointer-events-auto flex h-7 items-center px-1"
            >
              <span
                className={[
                  'h-1.5 rounded-full transition-all duration-200',
                  isCurrent ? 'w-5' : 'w-1.5',
                  verdict
                    ? VERDICT_BG[verdict]
                    : isCurrent
                      ? 'bg-ember'
                      : 'border border-night-raised bg-transparent',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>
    </header>
  );
}
