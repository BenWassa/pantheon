import type { PictureFacet } from '@/content/types';
import { FacetImagePlate } from './FacetImagePlate';

export function PictureBody({ facet }: { facet: PictureFacet }) {
  return <FacetImagePlate image={facet.image} />;
}
