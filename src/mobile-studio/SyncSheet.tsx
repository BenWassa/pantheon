import { useRef, useState } from 'react';
import { latestByTarget, type Judgment } from '@/content/judgments';
import { exportJsonl, exportSummary, mergeJudgments, parseImport } from './localLog';
import type { BackendMode } from './types';

interface SyncSheetProps {
  open: boolean;
  mode: BackendMode;
  judgments: Judgment[];
  onClose: () => void;
  onImport: (merged: Judgment[]) => void;
}

// Local mode keeps judgments in the browser. This sheet is how they leave it: an
// export in the exact JSONL the ledger uses (append it to content/judgments.jsonl),
// plus an import that merges a file back in. No backend, no data dead-end.
export function SyncSheet({ open, mode, judgments, onClose, onImport }: SyncSheetProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const opinions = latestByTarget(judgments).size;
  const jsonl = exportJsonl(judgments);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `pantheon-judgments-${stamp}.jsonl`;
  const summaryFilename = `pantheon-decisions-${stamp}.md`;

  function flash(message: string) {
    setStatus(message);
    setTimeout(() => setStatus(null), 2200);
  }

  function downloadFile(text: string, name: string, type: string) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonl);
      flash('JSONL copied to clipboard.');
    } catch {
      flash('Copy failed — use Download.');
    }
  }

  function handleDownload() {
    downloadFile(jsonl, filename, 'application/x-ndjson');
    flash('Ledger JSONL downloaded.');
  }

  function handleSummary() {
    downloadFile(exportSummary(judgments), summaryFilename, 'text/markdown');
    flash('Decisions summary downloaded.');
  }

  async function handleShare() {
    try {
      const file = new File([jsonl], filename, { type: 'application/x-ndjson' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Pantheon judgments' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Pantheon judgments', text: jsonl });
        return;
      }
      flash('Sharing not supported — use Download.');
    } catch {
      // User cancelled the share sheet; nothing to report.
    }
  }

  function applyImport(text: string) {
    try {
      const incoming = parseImport(text);
      if (incoming.length === 0) {
        flash('Nothing to import.');
        return;
      }
      const before = judgments.length;
      const merged = mergeJudgments(judgments, incoming);
      onImport(merged);
      const added = merged.length - before;
      flash(added > 0 ? `Merged ${added} new.` : 'Already up to date.');
      setImportText('');
      setShowImport(false);
    } catch {
      flash('Could not parse that file.');
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sync judgments"
        className="sheet-rise fixed bottom-0 left-0 right-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-night-raised bg-night-soft pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-night-raised" />

        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <div>
            <h2 className="font-display text-base text-ink">Sync</h2>
            <p className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint">
              {opinions} opinion{opinions === 1 ? '' : 's'} · {judgments.length} total on device
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-night-raised text-ink-faint active:text-ink"
          >
            ✕
          </button>
        </div>

        <p className="px-5 pb-3 pt-2 font-body text-xs leading-relaxed text-ink-faint">
          {mode === 'live' ? (
            <>
              Live — your decisions are already saved to the ledger. You can still export a copy
              here.
            </>
          ) : (
            <>Your decisions live on this device. Export them so nothing is lost.</>
          )}
        </p>

        {/* A readable record of your decisions — for you. */}
        <p className="px-5 pb-1.5 font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint">
          Your decisions
        </p>
        <div className="grid grid-cols-2 gap-2 px-4">
          <button
            type="button"
            onClick={handleSummary}
            disabled={opinions === 0}
            className="rounded-xl border border-ember/50 py-3 font-sans text-[0.65rem] uppercase tracking-widest2 text-ember active:bg-night-raised disabled:opacity-30"
          >
            Summary · .md
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={opinions === 0}
            className="rounded-xl border border-night-raised py-3 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink active:bg-night-raised disabled:opacity-30"
          >
            Share
          </button>
        </div>

        {/* The raw JSONL the revision report ingests. */}
        <p className="px-5 pb-1.5 pt-4 font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint">
          For the ledger · append to <span className="text-ink-muted">content/judgments.jsonl</span>
        </p>
        <div className="grid grid-cols-2 gap-2 px-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={opinions === 0}
            className="rounded-xl border border-night-raised py-3 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink active:bg-night-raised disabled:opacity-30"
          >
            Download · .jsonl
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={opinions === 0}
            className="rounded-xl border border-night-raised py-3 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink active:bg-night-raised disabled:opacity-30"
          >
            Copy JSONL
          </button>
        </div>

        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => setShowImport((s) => !s)}
            aria-expanded={showImport}
            className="font-sans text-[0.6rem] uppercase tracking-widest2 text-ink-faint active:text-ink"
          >
            {showImport ? '▾' : '▸'} Import / merge a file
          </button>
        </div>

        {showImport ? (
          <div className="space-y-2 px-4 pb-2 pt-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste judgments JSONL or a JSON array…"
              rows={3}
              className="w-full resize-none rounded-xl border border-night-raised bg-night px-3.5 py-2.5 font-body text-xs text-ink placeholder:text-ink-faint focus:border-ember/60 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyImport(importText)}
                disabled={!importText.trim()}
                className="flex-1 rounded-xl bg-ember py-2.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-night disabled:opacity-30"
              >
                Merge pasted
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 rounded-xl border border-night-raised py-2.5 font-sans text-[0.65rem] uppercase tracking-widest2 text-ink active:bg-night-raised"
              >
                Choose file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".jsonl,.json,.txt,application/json"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </div>
        ) : null}

        <div className="h-5 px-5 pt-1">
          {status ? (
            <p role="status" aria-live="polite" className="font-sans text-[0.65rem] text-ember">
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
