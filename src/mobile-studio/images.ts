import type { ImageRef } from '@/content/types';
import { contentUrl } from '@/content/urls';

// Resolve a facet image to a fetchable URL. Local paths (/content/...) are made
// base-aware so they resolve under the GitHub Pages subpath; external Commons
// URLs pass through unchanged. Shared by the card and the prefetcher so both
// request the exact same URL (and hit the same cache entry).
export function facetImageUrl(image: ImageRef): string {
  return image.src.startsWith('/content/') ? contentUrl(image.src) : image.src;
}
