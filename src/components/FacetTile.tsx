import type { FacetKey } from '@/content/types';

// A single hidden tile in the grid. Shows only the facet's one word until tapped.
// Read tiles are distinguished only subtly, in keeping with the restrained aesthetic
// (no badges, no streaks).
export function FacetTile({
  oneWord,
  facetKey,
  read,
  onOpen,
}: {
  oneWord: string;
  facetKey: FacetKey;
  read: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Reveal the ${facetKey} facet`}
      className={[
        'group flex aspect-square items-center justify-center rounded-lg border p-4 transition-colors',
        'border-night-raised bg-night-soft hover:border-ember/40 hover:bg-night-raised',
        read ? 'text-ink-muted' : 'text-ink',
      ].join(' ')}
    >
      <span className="font-display text-xl tracking-wide sm:text-2xl">{oneWord}</span>
      {read ? <span className="sr-only"> (read)</span> : null}
    </button>
  );
}
