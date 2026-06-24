import { useCallback, useRef } from 'react';

interface SwipeOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Minimum px displacement to trigger navigation. */
  threshold?: number;
  /** Minimum px/ms velocity to trigger navigation even below threshold. */
  velocityThreshold?: number;
  /** The scrollable reading area, so navigation only fires at its edges. */
  contentScrollRef?: React.RefObject<HTMLElement>;
}

type Mode = 'idle' | 'read' | 'next' | 'prev';

// Vertical swipe navigates the deck, but reading wins: a drag is only navigation
// when the content is already at the matching edge. Swipe up at the bottom (or on a
// card with nothing to scroll) goes to the next card; swipe down at the top goes
// back. Anywhere in between, the gesture is a native scroll and we never touch it.
export function useSwipeDeck({
  onNext,
  onPrev,
  threshold = 56,
  velocityThreshold = 0.4,
  contentScrollRef,
}: SwipeOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const mode = useRef<Mode>('idle');

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  onNextRef.current = onNext;
  onPrevRef.current = onPrev;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? 0;
    startY.current = e.touches[0]?.clientY ?? 0;
    startTime.current = Date.now();
    mode.current = 'idle';
    const el = elementRef.current;
    if (el) el.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (mode.current === 'read') return;
      const dx = (e.touches[0]?.clientX ?? startX.current) - startX.current;
      const dy = (e.touches[0]?.clientY ?? startY.current) - startY.current;

      // Decide once per gesture what this drag is.
      if (mode.current === 'idle') {
        if (Math.abs(dx) > Math.abs(dy)) {
          mode.current = 'read';
          return;
        }
        if (Math.abs(dy) < 6) return; // not committed yet
        const scrollEl = contentScrollRef?.current;
        const atTop = !scrollEl || scrollEl.scrollTop <= 1;
        const atBottom =
          !scrollEl || scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
        if (dy < 0 && atBottom) mode.current = 'next';
        else if (dy > 0 && atTop) mode.current = 'prev';
        else {
          mode.current = 'read'; // mid-content: leave it to native scroll
          return;
        }
      }

      // A navigation gesture: follow the finger with a little resistance.
      const el = elementRef.current;
      if (el) el.style.transform = `translateY(${dy * 0.6}px)`;
    },
    [contentScrollRef],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const navigating = mode.current === 'next' || mode.current === 'prev';
      const goingNext = mode.current === 'next';
      mode.current = 'idle';
      if (!navigating) return;

      const endY = e.changedTouches[0]?.clientY ?? startY.current;
      const delta = endY - startY.current;
      const elapsed = Math.max(Date.now() - startTime.current, 1);
      const velocity = Math.abs(delta) / elapsed;

      const el = elementRef.current;
      if (!el) return;

      const commit = Math.abs(delta) > threshold || velocity > velocityThreshold;

      if (commit) {
        const exitY = goingNext ? -(window.innerHeight + 40) : window.innerHeight + 40;
        el.style.transition = 'transform 160ms ease-in';
        el.style.transform = `translateY(${exitY}px)`;
        setTimeout(() => {
          el.style.transition = 'none';
          el.style.transform = '';
          if (goingNext) onNextRef.current();
          else onPrevRef.current();
        }, 165);
      } else {
        el.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      }
    },
    [threshold, velocityThreshold],
  );

  return {
    elementRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
