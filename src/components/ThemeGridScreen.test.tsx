import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ThemeGridScreen } from './ThemeGridScreen';
import { useAppStore } from '@/store/useAppStore';
import { emptyState } from '@/store/persistence';
import type { Day } from '@/content/types';

const hubris = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'content', 'days', '001-hubris.json'), 'utf8'),
) as Day;

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    persisted: { ...emptyState(), currentDayIndex: 1 },
    loadedDay: hubris,
    loading: false,
    error: null,
  });
});

describe('ThemeGridScreen', () => {
  it('renders the theme, facet labels, and one-word hooks, hiding the bodies', () => {
    render(<ThemeGridScreen day={hubris} />);
    expect(screen.getByRole('heading', { name: 'Hubris' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `Reveal the Person facet: ${hubris.facets.person.oneWord}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Picture')).toBeInTheDocument();
    expect(screen.getByText(hubris.facets.picture.oneWord)).toBeInTheDocument();
    // The body text is hidden until a tile is tapped.
    expect(screen.queryByText(/Qin Shi Huang/)).not.toBeInTheDocument();
  });

  it('records the day as opened on mount (the open-rate signal)', () => {
    render(<ThemeGridScreen day={hubris} />);
    const record = useAppStore.getState().persisted.records[1];
    expect(record?.firstOpenedAt).toBeTruthy();
  });

  it('reveals a facet on tap and marks it read on close', async () => {
    const user = userEvent.setup();
    render(<ThemeGridScreen day={hubris} />);

    await user.click(screen.getByRole('button', { name: /Reveal the Person facet/ }));
    expect(screen.getByRole('heading', { name: 'Qin Shi Huang' })).toBeInTheDocument();

    // readFacet is deferred to close so misclicks don't corrupt the read state.
    expect(useAppStore.getState().persisted.records[1]?.facetsRead.person).toBeFalsy();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().persisted.records[1]?.facetsRead.person).toBeTruthy();
  });
});
