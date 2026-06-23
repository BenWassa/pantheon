import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Day } from '@/content/types';

const hubris = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'content', 'days', '001-hubris.json'), 'utf8'),
) as Day;

const submit = vi.fn().mockResolvedValue(undefined);

// Drive the component with a stub backend so the test never touches the network.
vi.mock('./backend', () => ({
  detectBackend: async () => ({
    mode: 'local' as const,
    loadDays: async () => [hubris],
    loadJudgments: async () => [],
    submit,
  }),
}));

import { MobileStudio } from './MobileStudio';

beforeEach(() => {
  localStorage.clear();
  submit.mockClear();
});

describe('MobileStudio', () => {
  it('loads the backend day and shows the first facet with verdict controls', async () => {
    render(<MobileStudio />);
    expect(await screen.findByText('Hubris')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: hubris.facets.person.oneWord }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Keep:/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cut:/ })).toBeInTheDocument();
  });
});
