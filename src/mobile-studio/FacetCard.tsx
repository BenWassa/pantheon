import { useState } from 'react';
import type { Facet } from '@/content/types';
import type { Verdict } from '@/content/judgments';
import { FACET_LABELS } from '@/lib/facetLabels';
import { ImageLightbox } from '@/components/ImageLightbox';
import { facetImageUrl } from './images';
import { VERDICT_META } from './verdictMeta';

interface FacetCardProps {
  facet: Facet;
  enterFrom: 'bottom' | 'top' | null;
  scrollRef: React.RefObject<HTMLDivElement>;
  /** The current verdict on this facet, if any, shown as a quiet corner mark. */
  verdict?: Verdict;
}

export function FacetCard({ facet, enterFrom, scrollRef, verdict }: FacetCardProps) {
  const enterClass =
    enterFrom === 'bottom' ? 'enter-from-bottom' : enterFrom === 'top' ? 'enter-from-top' : '';

  const image = 'image' in facet ? facet.image : undefined;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className={`h-full bg-night ${enterClass}`}>
      {/* The whole card scrolls, so the reading area runs nearly full-screen and the
          hero scrolls away. The header and verdict pill float over it. */}
      <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
        {/* Hero image — tap to view full screen. Part of the scroll, so it slides
            away as you read; the header floats over its top. */}
        {image ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View image full screen"
            className="relative block h-[22dvh] w-full overflow-hidden bg-night-soft"
          >
            <img
              src={facetImageUrl(image)}
              alt={image.alt}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {/* Gradients so the floating header (top) and the title (bottom) read clearly */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night to-transparent" />
            {/* Tap-to-expand affordance */}
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-ink-faint/25 bg-night/55 px-2.5 py-1 font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-muted backdrop-blur-sm">
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

        {/* Content — held to a prose measure, clearing the floating header (when
            there is no hero) and the floating verdict pill at the bottom. */}
        <div className={`mx-auto max-w-prose px-5 pb-32 ${image ? 'pt-3' : 'pt-32'}`}>
          {/* Facet label + current verdict mark */}
          <div className="flex items-center justify-between">
            <p className="font-sans text-[0.7rem] uppercase tracking-widest2 text-ember">
              {FACET_LABELS[facet.key]}
            </p>
            {verdict ? (
              <span
                className={`font-sans text-[0.65rem] uppercase tracking-widest2 ${VERDICT_META[verdict].color}`}
              >
                {VERDICT_META[verdict].glyph} {VERDICT_META[verdict].label}
              </span>
            ) : null}
          </div>

          {/* Reveal word: the day-specific hook, shown large */}
          <h1 className="mt-3 font-display text-[2.6rem] leading-[1.05] tracking-[-0.01em] text-ink [text-wrap:balance]">
            {facet.oneWord}
          </h1>

          {/* Revealed heading */}
          <h2 className="mt-2.5 font-body text-[1.0625rem] italic leading-snug text-ink-muted">
            {facet.title}
          </h2>

          {/* Body: the reader's reading treatment, parchment ink at a calm measure */}
          <p className="mt-6 font-body text-[1.0625rem] leading-[1.85] text-ink [text-wrap:pretty]">
            {facet.body}
          </p>

          {/* Poem-specific content */}
          {facet.key === 'poem' ? (
            <div className="mt-6">
              <div className="mb-4 h-px w-8 bg-ember/40" />
              {facet.poem.status === 'public-domain' ? (
                <pre className="whitespace-pre-wrap font-body text-base leading-relaxed text-ink">
                  {facet.poem.full}
                </pre>
              ) : (
                <>
                  {facet.poem.excerpt ? (
                    <blockquote className="border-l border-ember/50 pl-4 font-body text-base italic leading-relaxed text-ink">
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
            className="mt-8 flex items-center gap-1.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink-faint active:text-ink"
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
