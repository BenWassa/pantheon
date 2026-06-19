import { useEffect, useRef } from 'react';
import type { Facet } from '@/content/types';
import { FACET_LABELS } from '@/lib/facetLabels';
import { PoemBody } from './PoemBody';
import { PictureBody } from './PictureBody';
import { SourcesList } from './SourcesList';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FacetDetail({ facet, onClose }: { facet: Facet; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Manage the dialog's lifecycle: lock background scroll, restore focus on close,
  // close on Escape, and keep Tab focus within the panel.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog so keyboard and screen-reader users land here.
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [onClose]);

  return (
    <div
      className="animate-veil fixed inset-0 z-20 overflow-y-auto bg-night/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${FACET_LABELS[facet.key]}: ${facet.title}`}
    >
      {/* A full-bleed dismiss surface behind the panel. Clicking off the content closes. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default"
      />
      <div ref={panelRef} className="animate-lift mx-auto min-h-full max-w-2xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-widest2 text-ember">
              {FACET_LABELS[facet.key]}
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">{facet.title}</h2>
          </div>
          <button
            ref={closeRef}
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
    </div>
  );
}
