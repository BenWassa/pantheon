import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ThemeGridScreen } from '@/components/ThemeGridScreen';
import { EmptyState } from '@/components/EmptyState';

export default function App() {
  const init = useAppStore((s) => s.init);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const loadedDay = useAppStore((s) => s.loadedDay);

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) {
    return <EmptyState title="Pantheon" message="Opening today’s theme." pulse />;
  }

  if (error) {
    return (
      <EmptyState
        title="Something went quiet"
        message="Today's theme didn't load. Check your connection and try again."
        action={{ label: 'Try again', onClick: () => void init() }}
      />
    );
  }

  if (!loadedDay) {
    return (
      <EmptyState
        title="You’re caught up"
        message="The next theme has not unlocked yet. Come back tomorrow."
      />
    );
  }

  return <ThemeGridScreen day={loadedDay} />;
}
