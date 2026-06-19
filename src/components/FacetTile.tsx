import type { FacetKey } from '@/content/types';

// A single hidden tile in the grid. Shows only the facet's one word until tapped.
// Read tiles are distinguished only subtly, in keeping with the restrained aesthetic
// (no badges, no streaks): a dimmed word and a single faint ember dot.
export function FacetTile({
  oneWord,
  facetKey,
  read,
  index,
  onOpen,
}: {
  oneWord: string;
  facetKey: FacetKey;
  read: boolean;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Reveal the ${facetKey} facet`}
      style={{ animationDelay: `${index * 70}ms` }}
      className={[
        'group relative flex aspect-square items-center justify-center rounded-lg border p-4',
        'animate-rise transition-colors duration-300 ease-out',
        'border-night-raised bg-night-soft hover:border-ember/40 hover:bg-night-raised',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60',
        'active:scale-[0.98] active:transition-transform active:duration-75',
        read ? 'text-ink-muted' : 'text-ink',
      ].join(' ')}
    >
      <span className="font-display text-xl tracking-wide transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-2xl">
        {oneWord}
      </span>
      {read ? (
        <>
          <span
            aria-hidden="true"
            className="absolute bottom-2.5 right-2.5 h-1 w-1 rounded-full bg-ember/50"
          />
          <span className="sr-only"> (read)</span>
        </>
      ) : null}
    </button>
  );
}
