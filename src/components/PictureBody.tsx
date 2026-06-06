import { useState } from 'react';
import type { PictureFacet } from '@/content/types';
import { Attribution } from './Attribution';

export function PictureBody({ facet }: { facet: PictureFacet }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="mb-6">
      {failed ? (
        <div className="flex aspect-[4/3] items-center justify-center rounded border border-night-raised bg-night-soft text-sm text-ink-faint">
          {facet.image.alt}
        </div>
      ) : (
        <img
          src={facet.image.src}
          alt={facet.image.alt}
          width={facet.image.width}
          height={facet.image.height}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full rounded border border-night-raised bg-night-soft"
        />
      )}
      <figcaption>
        <Attribution image={facet.image} />
      </figcaption>
    </figure>
  );
}
