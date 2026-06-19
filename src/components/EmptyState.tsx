// The constellation mark: six faint facets around a single ember.
// Echoes the favicon and the day's six-facet structure.
function Mark({ pulse = false }: { pulse?: boolean }) {
  const points: Array<[number, number]> = [
    [32, 14],
    [49.6, 23],
    [49.6, 41],
    [32, 50],
    [14.4, 41],
    [14.4, 23],
  ];
  return (
    <svg viewBox="0 0 64 64" className="mb-8 h-12 w-12" aria-hidden="true" fill="none">
      {points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" className="fill-ink-faint" />
      ))}
      <circle
        cx="32"
        cy="32"
        r="5"
        className={['fill-ember', pulse ? 'animate-pulse' : ''].join(' ')}
      />
    </svg>
  );
}

export function EmptyState({
  title,
  message,
  pulse = false,
}: {
  title: string;
  message: string;
  pulse?: boolean;
}) {
  return (
    <div className="animate-veil flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <Mark pulse={pulse} />
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{message}</p>
    </div>
  );
}
