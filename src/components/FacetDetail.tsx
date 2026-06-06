import { useEffect } from 'react';
import type { Facet } from '@/content/types';
import { FACET_LABELS } from '@/lib/facetLabels';
import { PoemBody } from './PoemBody';
import { PictureBody } from './PictureBody';
import { SourcesList } from './SourcesList';

export function FacetDetail({ facet, onClose }: { facet: Facet; onClose: () => void }) {
  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-20 overflow-y-auto bg-night/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${FACET_LABELS[facet.key]}: ${facet.title}`}
    >
      <div className="mx-auto min-h-full max-w-2xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-widest2 text-ember">
              {FACET_LABELS[facet.key]}
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">{facet.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded border border-night-raised px-3 py-1 text-sm text-ink-muted hover:text-ink"
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
