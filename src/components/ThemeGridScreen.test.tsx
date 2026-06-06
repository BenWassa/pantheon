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
  it('renders the theme and the six one-word tiles, hiding the bodies', () => {
    render(<ThemeGridScreen day={hubris} />);
    expect(screen.getByRole('heading', { name: 'Hubris' })).toBeInTheDocument();
    expect(screen.getByText('Emperor')).toBeInTheDocument();
    // The body text is hidden until a tile is tapped.
    expect(screen.queryByText(/Qin Shi Huang/)).not.toBeInTheDocument();
  });

  it('records the day as opened on mount (the open-rate signal)', () => {
    render(<ThemeGridScreen day={hubris} />);
    const record = useAppStore.getState().persisted.records[1];
    expect(record?.firstOpenedAt).toBeTruthy();
  });

  it('reveals a facet on tap and marks it read', async () => {
    const user = userEvent.setup();
    render(<ThemeGridScreen day={hubris} />);

    await user.click(screen.getByRole('button', { name: /Reveal the person facet/ }));

    expect(screen.getByRole('heading', { name: 'Qin Shi Huang' })).toBeInTheDocument();
    expect(useAppStore.getState().persisted.records[1]?.facetsRead.person).toBeTruthy();
  });
});
