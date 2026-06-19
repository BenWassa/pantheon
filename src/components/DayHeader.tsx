import { FACET_ORDER } from '@/content/types';
import type { FacetKey } from '@/content/types';

export function DayHeader({
  index,
  theme,
  facetsRead,
}: {
  index: number;
  theme: string;
  facetsRead: Partial<Record<FacetKey, string>>;
}) {
  const readCount = FACET_ORDER.filter((k) => facetsRead[k]).length;

  return (
    <header className="mb-10 text-center">
      <p className="text-[0.7rem] uppercase tracking-widest2 text-ink-faint">Day {index}</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{theme}</h1>

      {/* A whisper-quiet record of today: six points, lit as each facet is revealed. */}
      <div
        className="mt-5 flex items-center justify-center gap-1.5"
        role="img"
        aria-label={`${readCount} of ${FACET_ORDER.length} facets revealed`}
      >
        {FACET_ORDER.map((k) => (
          <span
            key={k}
            className={[
              'h-1 w-1 rounded-full transition-colors duration-500',
              facetsRead[k] ? 'bg-ember/60' : 'bg-night-raised',
            ].join(' ')}
          />
        ))}
      </div>
    </header>
  );
}
