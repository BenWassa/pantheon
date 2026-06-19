import type { Source } from '@/content/types';

function formatSource(s: Source): string {
  const parts: string[] = [];
  if (s.author) parts.push(s.author);
  parts.push(s.title);
  if (s.publisher) parts.push(s.publisher);
  if (s.year) parts.push(String(s.year));
  return parts.join(', ');
}

// Credibility is the product's only real asset, so sources are shown, not hidden.
export function SourcesList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-8 border-t border-night-raised pt-4">
      <h3 className="text-[0.7rem] uppercase tracking-widest2 text-ink-faint">Sources</h3>
      <ul className="mt-2 space-y-1.5">
        {sources.map((s, i) => (
          <li key={i} className="text-xs leading-relaxed text-ink-muted">
            <span className="text-ink-faint">{s.kind === 'primary' ? 'Main source. ' : ''}</span>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-ink-faint underline-offset-2 hover:text-ink"
              >
                {formatSource(s)}
              </a>
            ) : (
              formatSource(s)
            )}
            {s.note ? <span className="text-ink-faint"> ({s.note})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
