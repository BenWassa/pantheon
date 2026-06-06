import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PictureBody } from './PictureBody';
import type { PictureFacet } from '@/content/types';

const facet: PictureFacet = {
  key: 'picture',
  oneWord: 'Word',
  title: 'A Picture',
  body: 'how to look',
  sources: [{ kind: 'secondary', title: 'x' }],
  image: {
    src: '/content/images/placeholder.svg',
    alt: 'An alt description',
    attribution: 'Some Artist, a museum',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://example.org/file',
  },
};

describe('PictureBody', () => {
  it('renders the image with its alt text and a licensed attribution link', () => {
    render(<PictureBody facet={facet} />);
    expect(screen.getByAltText('An alt description')).toBeInTheDocument();
    expect(screen.getByText(/Some Artist, a museum/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'CC BY 4.0' });
    expect(link).toHaveAttribute('href', 'https://example.org/file');
  });
});
