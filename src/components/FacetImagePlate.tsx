import { useState } from 'react';
import type { ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';
import { Attribution } from './Attribution';
import { ImageLightbox } from './ImageLightbox';

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
  const [zoomed, setZoomed] = useState(false);
  const [loadedSize, setLoadedSize] = useState<ImageSize | null>(null);
  const size = loadedSize ?? knownSize(image);
  const isPortrait = size ? size.height > size.width : false;
  const aspectRatio = size ? `${size.width} / ${size.height}` : '4 / 3';

  const frame = [
    'relative overflow-hidden rounded-lg border border-night-raised bg-night-soft',
    isPortrait ? 'mx-auto h-[42dvh] max-h-[26rem] max-w-full' : 'w-full',
  ].join(' ');

  return (
    <figure className="mb-7 mt-5">
      {failed ? (
        <div
          className={`${frame} flex items-center justify-center px-5 text-center font-sans text-sm leading-relaxed text-ink-faint`}
          style={{ aspectRatio }}
        >
          {image.alt}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View image full screen"
          className={`group block cursor-zoom-in ${frame} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember/60`}
          style={{ aspectRatio }}
        >
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
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-ink-faint/25 bg-night/55 text-ink-muted backdrop-blur-sm transition-colors group-hover:border-ember/40 group-hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </span>
        </button>
      )}
      <figcaption>
        <Attribution image={image} />
      </figcaption>
      {zoomed ? <ImageLightbox image={image} onClose={() => setZoomed(false)} /> : null}
    </figure>
  );
}
