import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Day } from '@/content/types';
import type { Judgment } from '@/content/judgments';

// Mock the dev API so the Studio runs without a live server.
const fetchDays = vi.fn();
const fetchJudgments = vi.fn();
const postJudgment = vi.fn();
const deleteJudgment = vi.fn();
vi.mock('./api', () => ({
  fetchDays: () => fetchDays(),
  fetchJudgments: () => fetchJudgments(),
  postJudgment: (j: Judgment) => postJudgment(j),
  deleteJudgment: (id: string) => deleteJudgment(id),
}));

import { Studio } from './Studio';

const hubris = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'content', 'days', '001-hubris.json'), 'utf8'),
) as Day;

beforeEach(() => {
  // Clear call history so a test's assertions on call counts never see calls
  // leaked from an earlier test in the file.
  fetchDays.mockClear();
  fetchJudgments.mockClear();
  postJudgment.mockClear();
  deleteJudgment.mockClear();
  fetchDays.mockResolvedValue([hubris]);
  fetchJudgments.mockResolvedValue([]);
  postJudgment.mockImplementation((j: Judgment) => Promise.resolve(j));
  deleteJudgment.mockResolvedValue(undefined);
});

describe('Studio', () => {
  it('loads the corpus and shows the day-lens card', async () => {
    render(<Studio />);
    expect(await screen.findByRole('heading', { name: 'Hubris' })).toBeInTheDocument();
    expect(screen.getByText(/reviewed/)).toBeInTheDocument();
  });

  it('records a verdict for the focused card and advances', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await screen.findByRole('heading', { name: 'Hubris' });

    await user.click(screen.getByRole('button', { name: /Keep/ }));

    await waitFor(() => expect(postJudgment).toHaveBeenCalledTimes(1));
    const sent = postJudgment.mock.calls[0]![0] as Judgment;
    expect(sent.verdict).toBe('keep');
    expect(sent.target.level).toBe('day');
    expect(sent.target.slug).toBe('hubris');
  });

  it('switches lenses to review facets', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await screen.findByRole('heading', { name: 'Hubris' });

    await user.click(screen.getByRole('button', { name: 'Facet' }));

    // Facet lens surfaces the six facet titles; the first is the Person facet.
    expect(await screen.findByRole('heading', { name: 'Qin Shi Huang' })).toBeInTheDocument();
  });

  it('can focus the feed on cards that still need judgment', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await screen.findByRole('heading', { name: 'Hubris' });

    await user.click(screen.getByRole('button', { name: /Keep/ }));
    await user.click(screen.getByRole('button', { name: 'All cards' }));

    expect(
      await screen.findByText('Everything in this lens has a current judgment.'),
    ).toBeInTheDocument();
  });

  it('carries a typed suggestion onto the recorded judgment', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await screen.findByRole('heading', { name: 'Hubris' });

    await user.type(
      screen.getByPlaceholderText(/Suggested rewrite/),
      'A tighter line about overreach.',
    );
    await user.click(screen.getByRole('button', { name: /Fix/ }));

    await waitFor(() => expect(postJudgment).toHaveBeenCalledTimes(1));
    const sent = postJudgment.mock.calls[0]![0] as Judgment;
    expect(sent.verdict).toBe('fix');
    expect(sent.suggestion).toBe('A tighter line about overreach.');
  });

  it('skips judged cards when jumping to the next gap with n', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await screen.findByRole('heading', { name: 'Hubris' });

    // Facet lens: six cards in charter order, the first is the Person facet.
    await user.click(screen.getByRole('button', { name: 'Facet' }));
    expect(await screen.findByRole('heading', { name: 'Qin Shi Huang' })).toBeInTheDocument();

    // Judge facets 0 and 1 (each Keep auto-advances), then walk back to facet 0.
    await user.click(screen.getByRole('button', { name: /Keep/ })); // facet 0 -> 1
    await user.click(screen.getByRole('button', { name: /Keep/ })); // facet 1 -> 2
    await user.keyboard('kk'); // back to facet 0

    // n from facet 0 must skip the two judged facets and land on facet 2.
    await user.keyboard('n');
    expect(
      await screen.findByRole('heading', { name: 'Musée des Beaux Arts' }),
    ).toBeInTheDocument();
  });
});
