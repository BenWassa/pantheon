import { useCallback, useRef } from 'react';

interface SwipeOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Minimum px displacement to trigger navigation. */
  threshold?: number;
  /** Minimum px/ms velocity to trigger navigation even below threshold. */
  velocityThreshold?: number;
  /** Ref to the scrollable content area — swipe-up is suppressed when it isn't at top. */
  contentScrollRef?: React.RefObject<HTMLElement>;
}

export function useSwipeDeck({
  onNext,
  onPrev,
  threshold = 56,
  velocityThreshold = 0.35,
  contentScrollRef,
}: SwipeOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const active = useRef(false);
  // Once a gesture is judged horizontal (a sideways flick, or letting the content
  // scroll) we stop steering the deck for the rest of that touch.
  const abandoned = useRef(false);

  // Keep callbacks in refs so onTouchEnd doesn't go stale.
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  onNextRef.current = onNext;
  onPrevRef.current = onPrev;

  const resetTransform = useCallback(() => {
    const el = elementRef.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = '';
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? 0;
    startY.current = e.touches[0]?.clientY ?? 0;
    startTime.current = Date.now();
    active.current = true;
    abandoned.current = false;
    const el = elementRef.current;
    if (el) el.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!active.current || abandoned.current) return;
      const dx = (e.touches[0]?.clientX ?? startX.current) - startX.current;
      const dy = (e.touches[0]?.clientY ?? startY.current) - startY.current;

      // A mostly-horizontal drag is not deck navigation; leave it to the browser.
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        abandoned.current = true;
        resetTransform();
        return;
      }

      // When the content area is scrolled down, a drag-up scrolls the content
      // rather than navigating to the next card.
      const scrollEl = contentScrollRef?.current;
      if (dy < 0 && scrollEl && scrollEl.scrollTop > 4) {
        abandoned.current = true;
        resetTransform();
        return;
      }

      const el = elementRef.current;
      if (el) el.style.transform = `translateY(${dy}px)`;
    },
    [contentScrollRef, resetTransform],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!active.current) return;
      active.current = false;
      if (abandoned.current) {
        resetTransform();
        return;
      }

      const endY = e.changedTouches[0]?.clientY ?? startY.current;
      const delta = endY - startY.current;
      const elapsed = Math.max(Date.now() - startTime.current, 1);
      const velocity = Math.abs(delta) / elapsed;

      const el = elementRef.current;
      if (!el) return;

      const commit = Math.abs(delta) > threshold || velocity > velocityThreshold;

      if (commit) {
        const goingUp = delta < 0; // swipe up = next
        const exitY = goingUp ? -(window.innerHeight + 20) : window.innerHeight + 20;
        el.style.transition = 'transform 160ms ease-in';
        el.style.transform = `translateY(${exitY}px)`;

        setTimeout(() => {
          el.style.transition = 'none';
          el.style.transform = '';
          if (goingUp) onNextRef.current();
          else onPrevRef.current();
        }, 165);
      } else {
        // Snap back to rest.
        el.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      }
    },
    [threshold, velocityThreshold, resetTransform],
  );

  return {
    elementRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
