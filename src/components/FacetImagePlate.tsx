import { useState } from 'react';
import type { ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { Attribution } from './Attribution';

interface ImageSize {
  width: number;
  height: number;
}

function imageSrc(image: ImageRef) {
  return image.src.startsWith('/content/') ? contentUrl(image.src) : image.src;
}

function knownSize(image: ImageRef): ImageSize | null {
  return image.width && image.height ? { width: image.width, height: image.height } : null;
}

export function FacetImagePlate({ image }: { image: ImageRef }) {
  const [failed, setFailed] = useState(false);
  const [loadedSize, setLoadedSize] = useState<ImageSize | null>(null);
  const size = loadedSize ?? knownSize(image);
  const isPortrait = size ? size.height > size.width : false;
  const aspectRatio = size ? `${size.width} / ${size.height}` : '4 / 3';

  return (
    <figure className="mb-7 mt-5">
      <div
        className={[
          'relative overflow-hidden rounded-lg border border-night-raised bg-night-soft',
          isPortrait ? 'mx-auto h-[42dvh] max-h-[26rem] max-w-full' : 'w-full',
        ].join(' ')}
        style={{ aspectRatio }}
      >
        {failed ? (
          <div className="flex h-full w-full items-center justify-center px-5 text-center font-sans text-sm leading-relaxed text-ink-faint">
            {image.alt}
          </div>
        ) : (
          <img
            src={imageSrc(image)}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            onLoad={(event) => {
              const img = event.currentTarget;
              setLoadedSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <figcaption>
        <Attribution image={image} />
      </figcaption>
    </figure>
  );
}
