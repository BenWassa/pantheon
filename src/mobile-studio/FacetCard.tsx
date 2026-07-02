import { useMemo, useState } from 'react';
import type { Facet } from '@/content/types';
import type { Verdict } from '@/content/judgments';
import { FACET_LABELS } from '@/lib/facetLabels';
import { ImageLightbox } from '@/components/ImageLightbox';
import { facetImageUrl } from './images';
import { VERDICT_META } from './verdictMeta';

interface FacetCardProps {
  facet: Facet;
  enterFrom: 'next' | 'prev' | null;
  scrollRef: React.RefObject<HTMLDivElement>;
  /** The current verdict on this facet, if any, shown as a quiet corner mark. */
  verdict?: Verdict;
}

// Split a body into paragraphs on blank lines (or single newlines), so multi-part
// prose reads with real spacing instead of one dense block.
function toParagraphs(body: string): string[] {
  const parts = body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [body];
}

export function FacetCard({ facet, enterFrom, scrollRef, verdict }: FacetCardProps) {
  const enterClass =
    enterFrom === 'next' ? 'enter-from-next' : enterFrom === 'prev' ? 'enter-from-prev' : '';

  const image = 'image' in facet ? facet.image : undefined;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // A broken/placeholder image must not dump raw alt text over the header: hide the
  // <img> and let the dark plate stand behind the reveal word instead.
  const [imgFailed, setImgFailed] = useState(false);
  const paragraphs = useMemo(() => toParagraphs(facet.body), [facet.body]);

  const label = FACET_LABELS[facet.key];
  const verdictMark = verdict ? (
    <span
      className={`flex items-center gap-1 font-sans text-[0.65rem] uppercase tracking-widest2 ${VERDICT_META[verdict].color}`}
    >
      {VERDICT_META[verdict].glyph} {VERDICT_META[verdict].label}
    </span>
  ) : null;

  return (
    <div className={`h-full select-none bg-night ${enterClass}`}>
      {/* The whole card scrolls as one column: an editorial hero at the top that
          slides away as you read, then the prose. The header and verdict pill float
          over it. */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {image ? (
          // Editorial hero: a tall, full-bleed plate with the facet label and reveal
          // word set over its lower third, magazine-style. Tap to view full screen.
          <button
            type="button"
            onClick={() => !imgFailed && setLightboxOpen(true)}
            aria-label="View image full screen"
            className="relative block h-[46dvh] max-h-[24rem] min-h-[15rem] w-full overflow-hidden bg-night-soft"
          >
            <img
              src={facetImageUrl(image)}
              alt={image.alt}
              loading="eager"
              decoding="async"
              draggable={false}
              onError={() => setImgFailed(true)}
              className={`h-full w-full object-cover ${imgFailed ? 'hidden' : ''}`}
            />
            {/* Scrims: top so the floating header reads; bottom (deep) so the reveal
                word and title sit on solid ground and meet the prose seamlessly. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/90 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night via-night/85 to-transparent" />

            {/* Reveal word set over the plate. */}
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[34rem] px-6 pb-5 text-left">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[0.7rem] uppercase tracking-widest2 text-ember">
                  {label}
                </span>
                {verdictMark}
              </div>
              <h1 className="mt-2 font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.01em] text-ink [text-wrap:balance]">
                {facet.oneWord}
              </h1>
            </div>

            {/* Tap-to-expand affordance (only when the image actually loaded) */}
            <span
              className={`absolute right-4 top-24 flex items-center gap-1 rounded-full border border-ink-faint/25 bg-night/55 px-2.5 py-1 font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-muted backdrop-blur-sm ${
                imgFailed ? 'hidden' : ''
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              View
            </span>
          </button>
        ) : null}

        {/* Prose column, held to a comfortable reading measure. Clears the floating
            header when there is no hero, and always the floating verdict pill. */}
        <div className={`mx-auto max-w-[34rem] px-6 pb-36 ${image ? 'pt-5' : 'pt-28'}`}>
          {/* Typographic hero for image-less facets: label + reveal word in-column. */}
          {!image ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[0.7rem] uppercase tracking-widest2 text-ember">
                  {label}
                </span>
                {verdictMark}
              </div>
              <h1 className="mt-3 font-display text-[2.75rem] font-medium leading-[1.02] tracking-[-0.01em] text-ink [text-wrap:balance]">
                {facet.oneWord}
              </h1>
            </>
          ) : null}

          {/* Revealed heading */}
          <h2
            className={`font-body text-[1.2rem] italic leading-snug text-ink-muted ${
              image ? 'mt-1' : 'mt-3'
            }`}
          >
            {facet.title}
          </h2>

          {/* Hairline between the heading and the body, a calm reading break. */}
          <div className="mt-5 h-px w-10 bg-ember/40" />

          {/* Body: the reader's treatment — parchment ink at a calm measure. */}
          <div className="mt-5 space-y-4">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-body text-[1.125rem] leading-[1.75] text-ink [text-wrap:pretty]"
              >
                {p}
              </p>
            ))}
          </div>

          {/* Poem-specific content */}
          {facet.key === 'poem' ? (
            <div className="mt-7">
              <div className="mb-4 h-px w-8 bg-ember/40" />
              {facet.poem.status === 'public-domain' ? (
                <pre className="whitespace-pre-wrap font-body text-[1.0625rem] leading-relaxed text-ink">
                  {facet.poem.full}
                </pre>
              ) : (
                <>
                  {facet.poem.excerpt ? (
                    <blockquote className="border-l border-ember/50 pl-4 font-body text-[1.0625rem] italic leading-relaxed text-ink">
                      {facet.poem.excerpt}
                    </blockquote>
                  ) : null}
                  <a
                    href={facet.poem.pointerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-sans text-xs uppercase tracking-widest2 text-ember"
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
            <p className="mt-5 font-body text-sm italic text-ink-muted">— {facet.attribution}</p>
          ) : null}

          {/* Sources — collapsed by default; the reviewer expands them to judge trust. */}
          <button
            type="button"
            onClick={() => setSourcesOpen((o) => !o)}
            aria-expanded={sourcesOpen}
            className="mt-9 flex items-center gap-1.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink-faint active:text-ink"
          >
            {facet.sources.length === 1 ? '1 source' : `${facet.sources.length} sources`}
            <span aria-hidden="true">{sourcesOpen ? '▾' : '▸'}</span>
          </button>
          {sourcesOpen ? (
            <ul className="mt-2 space-y-2 border-l border-night-raised pl-3">
              {facet.sources.map((s, i) => (
                <li key={i} className="font-body text-xs leading-relaxed text-ink-faint">
                  <span className="text-ink-muted">{s.title}</span>
                  {s.author ? `, ${s.author}` : ''}
                  {s.year ? ` (${s.year})` : ''}
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-ember"
                    >
                      ↗
                    </a>
                  ) : null}
                  {s.note ? <span className="italic"> — {s.note}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {image && lightboxOpen ? (
        <ImageLightbox image={image} onClose={() => setLightboxOpen(false)} />
      ) : null}
    </div>
  );
}
