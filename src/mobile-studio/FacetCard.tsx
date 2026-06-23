import type { Facet, ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { FACET_LABELS } from '@/lib/facetLabels';

function imageUrl(image: ImageRef): string {
  // Local paths start with /content/; external URLs pass through unchanged.
  return image.src.startsWith('/content/') ? contentUrl(image.src) : image.src;
}

interface FacetCardProps {
  facet: Facet;
  enterFrom: 'bottom' | 'top' | null;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function FacetCard({ facet, enterFrom, scrollRef }: FacetCardProps) {
  const enterClass =
    enterFrom === 'bottom' ? 'enter-from-bottom' : enterFrom === 'top' ? 'enter-from-top' : '';

  const image = 'image' in facet ? facet.image : undefined;

  return (
    <div className={`flex h-full flex-col bg-night ${enterClass}`}>
      {/* Hero image */}
      {image ? (
        <div className="relative h-[42dvh] flex-shrink-0 overflow-hidden bg-night-soft">
          <img
            src={imageUrl(image)}
            alt={image.alt}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
          {/* Gradient so text above the image reads clearly */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night to-transparent" />
        </div>
      ) : null}

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5">
        {/* Facet label */}
        <p className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ember">
          {FACET_LABELS[facet.key]}
        </p>

        {/* Reveal word */}
        <h1 className="mt-1 font-display text-[2.5rem] leading-tight text-ink">{facet.oneWord}</h1>

        {/* Title */}
        <h2 className="mt-2 font-body text-base leading-snug text-ink-muted">{facet.title}</h2>

        {/* Body */}
        <p className="mt-4 font-body text-[1rem] leading-relaxed text-ink-muted">{facet.body}</p>

        {/* Poem-specific content */}
        {facet.key === 'poem' ? (
          <div className="mt-5">
            <div className="mb-3 h-px w-8 bg-night-raised" />
            {facet.poem.status === 'public-domain' ? (
              <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-muted">
                {facet.poem.full}
              </pre>
            ) : (
              <>
                {facet.poem.excerpt ? (
                  <p className="font-body text-sm italic leading-relaxed text-ink-muted">
                    {facet.poem.excerpt}
                  </p>
                ) : null}
                <a
                  href={facet.poem.pointerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-sans text-xs text-ember"
                >
                  {facet.poem.pointerLabel} →
                </a>
              </>
            )}
            {facet.poet ? (
              <p className="mt-3 font-sans text-xs text-ink-faint">— {facet.poet}</p>
            ) : null}
          </div>
        ) : null}

        {/* Passage attribution */}
        {facet.key === 'passage' && facet.attribution ? (
          <p className="mt-4 font-sans text-xs italic text-ink-faint">— {facet.attribution}</p>
        ) : null}

        {/* Source hint */}
        <p className="mt-6 font-sans text-[0.6rem] text-ink-faint">
          {facet.sources.length === 1 ? '1 source' : `${facet.sources.length} sources`}
        </p>
      </div>
    </div>
  );
}
