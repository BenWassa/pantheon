import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('FacetDetail', () => {
  it('moves focus to the panel on open and restores it on close', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    opener.textContent = 'open';
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const onClose = vi.fn();
    render(<FacetDetail facet={facet} onClose={onClose} />);

    // Focus lands on the Close button inside the dialog.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));

    // Escape closes; once unmounted, focus returns to the opener.
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    opener.remove();
  });

  it('locks background scroll while open and frees it on unmount', () => {
    const { unmount } = render(<FacetDetail facet={facet} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FacetDetail facet={facet} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
