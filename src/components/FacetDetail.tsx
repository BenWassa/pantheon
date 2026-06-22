import { useEffect, useRef, useState } from 'react';
import type { Facet, ImageRef } from '@/content/types';
import { FACET_ORDER } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { FACET_LABELS } from '@/lib/facetLabels';
import { Attribution } from './Attribution';
import { PictureBody } from './PictureBody';
import { PoemBody } from './PoemBody';
import { SourcesList } from './SourcesList';

// Focus-trap targets. Exclude tabindex="-1" so the programmatically-focused
// heading and any decorative controls stay out of the Tab cycle.
const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function imageSrc(image: ImageRef) {
  return image.src.startsWith('/content/') ? contentUrl(image.src) : image.src;
}

// The full-bleed hero image, with the same graceful fallback as the plate:
// if it fails to load, the alt text holds the space rather than a broken frame.
function HeroImage({ image }: { image: ImageRef }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-night-soft px-10 text-center font-sans text-sm leading-relaxed text-ink-faint">
        {image.alt}
      </div>
    );
  }

  return (
    <img
      src={imageSrc(image)}
      alt={image.alt}
      width={image.width}
      height={image.height}
      onError={() => setFailed(true)}
      className="animate-unveil absolute inset-0 h-full w-full object-cover"
    />
  );
}

interface Props {
  facet: Facet;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  prevWord: string | null;
  nextWord: string | null;
}

export function FacetDetail({ facet, onClose, onPrev, onNext, prevWord, nextWord }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // Keep the latest callbacks in a ref so the key handler can stay mounted once.
  const cbRef = useRef({ onClose, onPrev, onNext });
  cbRef.current = { onClose, onPrev, onNext };

  const image = facet.image;
  const position = FACET_ORDER.indexOf(facet.key);

  // Scroll lock, focus restoration, and the keyboard model: set up once.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      const { onClose: close, onPrev: prev, onNext: next } = cbRef.current;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowLeft' && prev) {
        e.preventDefault();
        prev();
        return;
      }
      if (e.key === 'ArrowRight' && next) {
        e.preventDefault();
        next();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Reading-progress hairline + scroll cue, driven straight to the DOM so a
  // moving scrollbar never triggers a React render.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = el.scrollHeight - el.clientHeight;
        const ratio = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
        if (cueRef.current) cueRef.current.style.opacity = el.scrollTop > 24 ? '0' : '';
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // On open and on every facet change: announce the title, return to the top,
  // and reset the progress hairline and scroll cue.
  useEffect(() => {
    headingRef.current?.focus();
    const el = dialogRef.current;
    if (el) el.scrollTop = 0;
    if (progressRef.current) progressRef.current.style.transform = 'scaleX(0)';
    if (cueRef.current) cueRef.current.style.opacity = '';
  }, [facet]);

  return (
    <div
      ref={dialogRef}
      className="animate-veil fixed inset-0 z-20 overflow-y-auto bg-night"
      role="dialog"
      aria-modal="true"
      aria-label={`${FACET_LABELS[facet.key]}: ${facet.title}`}
    >
      {/* Reading progress: a single ember hairline that fills with the scroll. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-30 h-0.5">
        <div
          ref={progressRef}
          style={{ transform: 'scaleX(0)' }}
          className="h-full origin-left bg-ember/80"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-30 rounded-full border border-ink-faint/25 bg-night/55 px-3.5 py-1.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink-muted backdrop-blur-sm transition-colors hover:border-ember/40 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
      >
        Close
      </button>

      {/* Hero + article remount per facet so the reveal replays on navigation. */}
      <div key={facet.key}>
        <header className="relative flex min-h-[62dvh] flex-col justify-end overflow-hidden px-6 pb-12 pt-24">
          {image ? (
            <>
              <HeroImage image={image} />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/10"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/70 to-transparent"
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-x-6 top-28 h-px bg-gradient-to-r from-ember/40 via-ember/10 to-transparent"
            />
          )}

          <div className="animate-lift relative mx-auto w-full max-w-prose">
            <p className="font-sans text-[0.7rem] uppercase tracking-widest2 text-ember">
              {FACET_LABELS[facet.key]}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.01em] text-ink [text-wrap:balance] focus-visible:outline-none sm:text-5xl"
            >
              {facet.title}
            </h2>

            <div
              ref={cueRef}
              aria-hidden="true"
              className="mt-10 flex items-center gap-3 opacity-70 transition-opacity duration-500"
            >
              <span className="relative block h-8 w-px overflow-hidden bg-ink-faint/25">
                <span className="animate-cue absolute inset-x-0 top-0 h-2 bg-ember" />
              </span>
              <span className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint">
                Scroll to read
              </span>
            </div>
          </div>
        </header>

        <article className="animate-lift mx-auto w-full max-w-prose px-6 pb-16 pt-12">
          {image && facet.key !== 'picture' ? (
            <div className="mb-8">
              <Attribution image={image} />
            </div>
          ) : null}

          {facet.key === 'picture' ? <PictureBody facet={facet} /> : null}
          {facet.key === 'poem' ? <PoemBody facet={facet} /> : null}

          <p className="font-body text-[1.0625rem] leading-[1.85] text-ink [text-wrap:pretty] sm:text-[1.1875rem]">
            {facet.body}
          </p>

          {facet.key === 'passage' && facet.attribution ? (
            <p className="mt-4 font-body text-sm italic text-ink-muted">{facet.attribution}</p>
          ) : null}

          <SourcesList sources={facet.sources} />
        </article>
      </div>

      {/* Sticky reading furniture: where you are, and where you can go next. */}
      {(onPrev || onNext) && (
        <div className="sticky bottom-0 z-10 border-t border-night-raised bg-night/95 px-6 py-3 backdrop-blur-sm">
          <div className="mx-auto grid max-w-prose grid-cols-[1fr_auto_1fr] items-center gap-4">
            {onPrev ? (
              <button
                type="button"
                onClick={onPrev}
                className="group flex flex-col items-start text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
                aria-label={`Previous facet: ${prevWord}`}
              >
                <span className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint transition-colors group-hover:text-ink-muted">
                  Previous
                </span>
                <span className="font-display text-base text-ink-muted transition-colors group-hover:text-ink">
                  {prevWord}
                </span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1.5" aria-hidden="true">
              {FACET_ORDER.map((key, i) => (
                <span
                  key={key}
                  className={`h-1 w-1 rounded-full transition-colors ${
                    i === position ? 'bg-ember' : 'bg-ink-faint/40'
                  }`}
                />
              ))}
            </div>
            <span className="sr-only">
              Facet {position + 1} of {FACET_ORDER.length}
            </span>

            {onNext ? (
              <button
                type="button"
                onClick={onNext}
                className="group flex flex-col items-end text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
                aria-label={`Next facet: ${nextWord}`}
              >
                <span className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint transition-colors group-hover:text-ink-muted">
                  Next
                </span>
                <span className="font-display text-base text-ink-muted transition-colors group-hover:text-ink">
                  {nextWord}
                </span>
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
