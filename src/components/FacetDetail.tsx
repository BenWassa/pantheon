import { useEffect, useRef } from 'react';
import type { Facet } from '@/content/types';
import { FACET_LABELS } from '@/lib/facetLabels';
import { PoemBody } from './PoemBody';
import { PictureBody } from './PictureBody';
import { SourcesList } from './SourcesList';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  facet: Facet;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  prevWord: string | null;
  nextWord: string | null;
}

export function FacetDetail({ facet, onClose, onPrev, onNext, prevWord, nextWord }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Focus the heading so screen readers announce the facet title first,
    // not the close control.
    headingRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && onPrev) {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === 'ArrowRight' && onNext) {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
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
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="animate-veil fixed inset-0 z-20 flex flex-col overflow-y-auto bg-night/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${FACET_LABELS[facet.key]}: ${facet.title}`}
    >
      {/* Full-bleed dismiss surface behind the panel. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default"
      />

      {/* Scrollable content */}
      <div ref={panelRef} className="animate-lift mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-widest2 text-ember">
              {FACET_LABELS[facet.key]}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-display text-2xl text-ink focus-visible:outline-none"
            >
              {facet.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded border border-night-raised px-3 py-1 text-sm text-ink-muted transition-colors hover:border-ember/40 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          {facet.key === 'picture' ? <PictureBody facet={facet} /> : null}
          {facet.key === 'poem' ? <PoemBody facet={facet} /> : null}

          <p className="font-body text-base leading-relaxed text-ink">{facet.body}</p>

          {facet.key === 'passage' && facet.attribution ? (
            <p className="mt-3 text-sm italic text-ink-muted">{facet.attribution}</p>
          ) : null}

          <SourcesList sources={facet.sources} />
        </div>
      </div>

      {/* Sticky navigation footer */}
      {(onPrev || onNext) && (
        <div className="sticky bottom-0 z-10 border-t border-night-raised bg-night/95 px-6 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {onPrev ? (
              <button
                type="button"
                onClick={onPrev}
                className="group flex flex-col items-start text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
                aria-label={`Previous facet: ${prevWord}`}
              >
                <span className="text-[0.65rem] uppercase tracking-widest2 text-ink-faint transition-colors group-hover:text-ink-muted">
                  Previous
                </span>
                <span className="font-display text-base text-ink-muted transition-colors group-hover:text-ink">
                  {prevWord}
                </span>
              </button>
            ) : (
              <span />
            )}
            {onNext ? (
              <button
                type="button"
                onClick={onNext}
                className="group flex flex-col items-end text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
                aria-label={`Next facet: ${nextWord}`}
              >
                <span className="text-[0.65rem] uppercase tracking-widest2 text-ink-faint transition-colors group-hover:text-ink-muted">
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
