import type { ImageRef } from '@/content/types';

const LICENSE_LABELS: Record<ImageRef['license'], string> = {
  PD: 'Public domain',
  CC0: 'CC0',
  'CC-BY': 'CC BY',
  'CC-BY-SA': 'CC BY-SA',
  'CC-BY-4.0': 'CC BY 4.0',
  'CC-BY-SA-4.0': 'CC BY-SA 4.0',
};

export function Attribution({ image }: { image: ImageRef }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-faint">
      {image.attribution}{' '}
      <a
        href={image.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink"
      >
        {LICENSE_LABELS[image.license]}
      </a>
    </p>
  );
}
