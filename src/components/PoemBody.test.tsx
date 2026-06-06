import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoemBody } from './PoemBody';
import type { PoemFacet } from '@/content/types';

const base = {
  key: 'poem' as const,
  oneWord: 'Word',
  title: 'A Poem',
  body: 'commentary',
  sources: [{ kind: 'secondary' as const, title: 'x' }],
};

describe('PoemBody', () => {
  it('shows public-domain poems in full', () => {
    const facet: PoemFacet = {
      ...base,
      poem: { status: 'public-domain', full: 'Line one\nLine two' },
    };
    render(<PoemBody facet={facet} />);
    expect(screen.getByText(/Line one/)).toBeInTheDocument();
    expect(screen.queryByText(/still in copyright/)).not.toBeInTheDocument();
  });

  it('shows in-copyright poems as an excerpt with a pointer link', () => {
    const facet: PoemFacet = {
      ...base,
      poem: {
        status: 'in-copyright',
        excerpt: 'A short excerpt.',
        pointerUrl: 'https://example.org/poem',
        pointerLabel: 'Read it here',
      },
    };
    render(<PoemBody facet={facet} />);
    expect(screen.getByText('A short excerpt.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Read it here' });
    expect(link).toHaveAttribute('href', 'https://example.org/poem');
  });
});
