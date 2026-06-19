import type { FacetKey, ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { FACET_LABELS } from '@/lib/facetLabels';

// A single hidden tile in the grid. The facet label orients; the word tempts.
// Read tiles are distinguished only subtly, in keeping with the restrained aesthetic
// (no badges, no streaks): a dimmed word and a single faint ember dot.
export function FacetTile({
  oneWord,
  facetKey,
  image,
  read,
  index,
  onOpen,
}: {
  oneWord: string;
  facetKey: FacetKey;
  image?: ImageRef;
  read: boolean;
  index: number;
  onOpen: () => void;
}) {
  const label = FACET_LABELS[facetKey];
  const imageSrc = image
    ? image.src.startsWith('/content/')
      ? contentUrl(image.src)
      : image.src
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Reveal the ${label} facet: ${oneWord}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className={[
        'group relative flex min-h-0 w-full overflow-hidden rounded-lg border p-4 text-left',
        'animate-rise transition-colors duration-300 ease-out',
        'border-night-raised bg-night-soft hover:border-ember/40 hover:bg-night-raised',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60',
        'active:scale-[0.98] active:transition-transform active:duration-75',
        read ? 'text-ink-muted' : 'text-ink',
      ].join(' ')}
    >
      {imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-[0.85] transition duration-300 group-hover:scale-[1.03] group-hover:opacity-70"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/30 to-night/85"
          />
        </>
      ) : null}
      <span className="relative z-10 flex h-full w-full flex-col justify-between">
        <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-widest2 text-ink transition-colors duration-300 group-hover:text-ink [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
          {label}
        </span>
        <span className="font-display text-2xl tracking-wide transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-3xl [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {oneWord}
        </span>
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
