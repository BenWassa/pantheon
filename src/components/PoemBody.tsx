import type { PoemFacet } from '@/content/types';

// Public-domain poems are shown in full. In-copyright poems show only an optional short
// excerpt and a pointer to a licensed source, never the full text.
export function PoemBody({ facet }: { facet: PoemFacet }) {
  const { poem } = facet;

  if (poem.status === 'public-domain') {
    return (
      <div className="mb-6">
        {facet.poet ? <p className="mb-3 text-sm text-ink-muted">{facet.poet}</p> : null}
        <pre className="whitespace-pre-wrap font-body text-base leading-relaxed text-ink">
          {poem.full}
        </pre>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {facet.poet ? <p className="mb-3 text-sm text-ink-muted">{facet.poet}</p> : null}
      {poem.excerpt ? (
        <blockquote className="border-l border-ember/50 pl-4 font-body text-base italic leading-relaxed text-ink">
          {poem.excerpt}
        </blockquote>
      ) : null}
      <p className="mt-3 text-xs text-ink-faint">
        This poem is still in copyright, so it is not reproduced in full.{' '}
        <a
          href={poem.pointerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink"
        >
          {poem.pointerLabel}
        </a>
      </p>
    </div>
  );
}
