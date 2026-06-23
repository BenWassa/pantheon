import { useRegisterSW } from 'virtual:pwa-register/react';

// A quiet, dismissible notice: the app is cached for offline reading, or a new
// edition is waiting. Kept to the edge so it never interrupts the page itself.
export function PWAPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-lift fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-prose items-center gap-3 rounded-lg border border-night-raised bg-night-soft/95 px-4 py-3 backdrop-blur-sm">
        <p className="flex-1 font-body text-sm text-ink">
          {needRefresh ? 'A new edition is ready.' : 'Ready to read offline.'}
        </p>
        {needRefresh ? (
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="rounded border border-ember/40 px-3 py-1 font-sans text-xs uppercase tracking-widest2 text-ember transition-colors hover:bg-ember/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
          >
            Refresh
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="rounded px-2 py-1 font-sans text-xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
