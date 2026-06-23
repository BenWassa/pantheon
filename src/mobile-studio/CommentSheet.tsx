import { useEffect, useRef, useState } from 'react';
import type { MobileComment } from './types';

interface CommentSheetProps {
  open: boolean;
  comments: MobileComment[];
  onClose: () => void;
  onSubmit: (text: string) => void;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommentSheet({ open, comments, onClose, onSubmit }: CommentSheetProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Auto-focus textarea when sheet opens.
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Push sheet above soft keyboard using visualViewport.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    function handleResize() {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const offset = window.innerHeight - (vv?.height ?? window.innerHeight) - (vv?.offsetTop ?? 0);
      sheet.style.bottom = offset > 0 ? `${offset}px` : '';
    }

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [open]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notes"
        className="sheet-rise fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-night-raised bg-night-soft"
      >
        {/* Handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-night-raised" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <h2 className="font-display text-base text-ink">Notes</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-night-raised text-ink-faint active:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Existing comments */}
        {comments.length > 0 && (
          <ul className="max-h-48 overflow-y-auto border-t border-night-raised px-5 py-3">
            {[...comments].reverse().map((c) => (
              <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="font-body text-sm leading-relaxed text-ink">{c.text}</p>
                <p className="mt-1 font-sans text-[0.65rem] text-ink-faint">
                  {formatRelative(c.at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Input */}
        <div className="border-t border-night-raised px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What strikes you about this facet…"
              rows={3}
              className="flex-1 resize-none rounded-xl border border-night-raised bg-night px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim()}
              aria-label="Submit note"
              className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ember text-night transition-opacity disabled:opacity-30"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
          <p className="mt-2 font-sans text-[0.6rem] text-ink-faint">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
