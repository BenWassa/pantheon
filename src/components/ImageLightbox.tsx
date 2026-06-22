import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { Attribution } from './Attribution';

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function imageSrc(image: ImageRef) {
  return image.src.startsWith('/content/') ? contentUrl(image.src) : image.src;
}

// A full-screen view of a single image, shown uncropped against the night field.
// It sits above the facet detail and keeps its keys to itself: Escape and Tab are
// caught in the capture phase so the detail underneath neither closes nor navigates.
export function ImageLightbox({ image, onClose }: { image: ImageRef; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      // Swallow the detail's arrow-key navigation while the image is open.
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation();
        return;
      }
      if (e.key !== 'Tab') return;
      e.stopPropagation();

      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  // Portal to the body so the overlay escapes the detail's transformed (animate-lift)
  // ancestor, which would otherwise scope this fixed layer below the detail's chrome.
  return createPortal(
    <div
      ref={dialogRef}
      className="animate-veil fixed inset-0 z-40 flex flex-col bg-night"
      role="dialog"
      aria-modal="true"
      aria-label={`Image, full screen: ${image.alt}`}
    >
      {/* Click anywhere off the image to dismiss. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out"
      />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close full screen image"
        className="absolute right-4 top-4 z-10 rounded-full border border-ink-faint/25 bg-night/55 px-3.5 py-1.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink-muted backdrop-blur-sm transition-colors hover:border-ember/40 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
      >
        Close
      </button>

      <div className="pointer-events-none relative flex flex-1 items-center justify-center p-4 sm:p-10">
        <img
          src={imageSrc(image)}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="animate-lift max-h-full max-w-full rounded object-contain shadow-2xl"
        />
      </div>

      <div className="relative mx-auto w-full max-w-prose px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Attribution image={image} />
      </div>
    </div>,
    document.body,
  );
}
