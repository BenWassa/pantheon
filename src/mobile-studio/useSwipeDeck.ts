import { useCallback, useRef } from 'react';

interface SwipeOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Whether there is a card to move to in each direction (for end-of-deck resistance). */
  canNext: boolean;
  canPrev: boolean;
  /** Minimum px displacement to trigger navigation. */
  threshold?: number;
  /** Minimum px/ms velocity to trigger navigation even below threshold. */
  velocityThreshold?: number;
}

type Mode = 'idle' | 'read' | 'nav';

// Instagram-carousel navigation, not TikTok scroll-paging. The reading axis is
// vertical and belongs entirely to the browser (the container is touch-pan-y, so
// vertical drags scroll natively and never involve JS). Navigation is horizontal:
// swipe left for the next facet, right for the previous. This removes the fragile
// "swipe up only when you happen to be at the exact scroll bottom" coupling that
// made the old deck feel sloppy — you can move between facets from anywhere in the
// text, and reading is never interrupted by an accidental page turn.
export function useSwipeDeck({
  onNext,
  onPrev,
  canNext,
  canPrev,
  threshold = 64,
  velocityThreshold = 0.45,
}: SwipeOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const mode = useRef<Mode>('idle');
  // While a page turn is animating we ignore new gestures so a fast double-swipe
  // can't tear the deck or skip a card mid-transition.
  const busy = useRef(false);

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const canNextRef = useRef(canNext);
  const canPrevRef = useRef(canPrev);
  onNextRef.current = onNext;
  onPrevRef.current = onPrev;
  canNextRef.current = canNext;
  canPrevRef.current = canPrev;

  const width = () => elementRef.current?.clientWidth || window.innerWidth || 360;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (busy.current) return;
    startX.current = e.touches[0]?.clientX ?? 0;
    startY.current = e.touches[0]?.clientY ?? 0;
    startTime.current = Date.now();
    mode.current = 'idle';
    const el = elementRef.current;
    if (el) el.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (mode.current === 'read' || busy.current) return;
    const dx = (e.touches[0]?.clientX ?? startX.current) - startX.current;
    const dy = (e.touches[0]?.clientY ?? startY.current) - startY.current;

    // Lock the axis once, from the dominant direction. A vertical intent is
    // reading — hand it straight back to native scroll and never touch it again.
    if (mode.current === 'idle') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // not committed yet
      if (Math.abs(dy) >= Math.abs(dx)) {
        mode.current = 'read';
        return;
      }
      mode.current = 'nav';
    }

    // A horizontal navigation gesture: follow the finger. If there is no card in
    // that direction, drag against heavy resistance so the deck feels bounded
    // rather than broken — a rubber band, not a dead end.
    const goingNext = dx < 0;
    const blocked = goingNext ? !canNextRef.current : !canPrevRef.current;
    const eased = blocked ? dx * 0.3 : dx;
    const el = elementRef.current;
    if (el) el.style.transform = `translateX(${eased}px)`;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const navigating = mode.current === 'nav';
      mode.current = 'idle';
      const el = elementRef.current;
      if (!el || !navigating || busy.current) return;

      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const delta = endX - startX.current;
      const goingNext = delta < 0;
      const target = goingNext ? canNextRef.current : canPrevRef.current;
      const elapsed = Math.max(Date.now() - startTime.current, 1);
      const velocity = Math.abs(delta) / elapsed;
      const commit = target && (Math.abs(delta) > threshold || velocity > velocityThreshold);

      if (commit) {
        busy.current = true;
        const exitX = goingNext ? -(width() + 24) : width() + 24;
        el.style.transition = 'transform 150ms ease-in';
        el.style.transform = `translateX(${exitX}px)`;
        window.setTimeout(() => {
          // Swap the card off-screen, then let its entrance animation carry it in.
          el.style.transition = 'none';
          el.style.transform = '';
          if (goingNext) onNextRef.current();
          else onPrevRef.current();
          busy.current = false;
        }, 155);
      } else {
        // Not enough to turn the page (or nothing there): spring back.
        el.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';
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
