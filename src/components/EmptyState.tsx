export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{message}</p>
    </div>
  );
}
