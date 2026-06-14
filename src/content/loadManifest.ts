import type { Manifest } from './types';
import { contentUrl } from './urls';

// The app fetches the generated manifest once. It lists the published days in order.
export async function loadManifest(): Promise<Manifest> {
  const res = await fetch(contentUrl('manifest.json'), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load content manifest (${res.status}).`);
  }
  return (await res.json()) as Manifest;
}
