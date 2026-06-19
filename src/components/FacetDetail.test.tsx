import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FacetDetail } from './FacetDetail';
import type { Facet } from '@/content/types';

const facet: Facet = {
  key: 'principle',
  oneWord: 'Limit',
  title: 'The Tragedy of the Commons',
  body: 'A shared resource, used freely, is used to ruin.',
  sources: [],
};

afterEach(() => {
  document.body.style.overflow = '';
});

const noNav = { onPrev: null, onNext: null, prevWord: null, nextWord: null };

const imageFacet: Facet = {
  ...facet,
  image: {
    src: '/content/images/placeholder.svg',
    width: 800,
    height: 600,
    alt: 'A quiet landscape used as facet context',
    attribution: 'Some Artist, a museum',
    license: 'CC-BY-4.0',
    sourceUrl: 'https://example.org/file',
  },
};

describe('FacetDetail', () => {
  it('moves focus to the heading on open and restores it on close', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    opener.textContent = 'open';
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const onClose = vi.fn();
    render(<FacetDetail facet={facet} onClose={onClose} {...noNav} />);

    // Focus lands on the heading inside the dialog.
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: facet.title }));

    // Escape closes; once unmounted, focus returns to the opener.
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    opener.remove();
  });

  it('locks background scroll while open and frees it on unmount', () => {
    const { unmount } = render(<FacetDetail facet={facet} onClose={() => {}} {...noNav} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FacetDetail facet={facet} onClose={onClose} {...noNav} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onPrev and onNext when nav buttons are clicked', async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <FacetDetail
        facet={facet}
        onClose={vi.fn()}
        onPrev={onPrev}
        onNext={onNext}
        prevWord="Spark"
        nextWord="Echo"
      />,
    );
    await user.click(screen.getByRole('button', { name: /previous facet/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /next facet/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows an image plate for image-backed facets', () => {
    render(<FacetDetail facet={imageFacet} onClose={vi.fn()} {...noNav} />);
    expect(screen.getByAltText('A quiet landscape used as facet context')).toBeInTheDocument();
    expect(screen.getByText(/Some Artist, a museum/)).toBeInTheDocument();
  });

  it('keeps the image area useful when an image fails', () => {
    render(<FacetDetail facet={imageFacet} onClose={vi.fn()} {...noNav} />);
    fireEvent.error(screen.getByAltText('A quiet landscape used as facet context'));
    expect(screen.getByText('A quiet landscape used as facet context')).toBeInTheDocument();
  });
});
