// Turn the corpus into a flat, scrollable feed at a chosen granularity. This is
// the pure core of the Studio: given the days and a lens, it produces uniform
// review items, each pointing at exactly one judgable target. The UI stays thin;
// the levels the vision asks for (day, facet, title, reveal word, sentence) are
// all just feed items here.

import type { Day, DayStatus, FacetKey } from '@/content/types';
import { FACET_ORDER } from '@/content/types';
import { FACET_LABELS } from '@/lib/facetLabels';
import { type JudgmentTarget, splitSentences, targetId } from '@/content/judgments';

// The three review lenses, coarse to fine. "Line" explodes each facet into its
// reveal word, its title, and its individual sentences.
export type Lens = 'day' | 'facet' | 'line';

export const LENSES: readonly Lens[] = ['day', 'facet', 'line'] as const;

export const LENS_LABELS: Record<Lens, string> = {
  day: 'Day',
  facet: 'Facet',
  line: 'Line',
};

export const LENS_HINT: Record<Lens, string> = {
  day: 'Whole-day concepts. Test coherence, resonance, narrative force.',
  facet: 'One facet at a time. Test whether each unit earns its place.',
  line: 'Reveal words, titles, sentences. Test clarity, rhythm, copy, claims.',
};

export interface FeedItem {
  id: string; // = targetId(target); stable across re-renders and re-judging
  target: JudgmentTarget;
  status: DayStatus; // the day's status, for badges and filtering
  kicker: string; // small label, e.g. "Person · sentence 2/6"
  heading: string; // the line shown large
  body?: string; // longer prose, when the unit is a body or facet
  context?: string; // supporting orientation (the facet title, the threads)
  meta: string[]; // extra notes (sources, registers, entities)
}

function dayItem(day: Day): FeedItem {
  const target: JudgmentTarget = {
    level: 'day',
    day: day.index,
    slug: day.slug,
    field: 'theme',
    text: day.theme,
  };
  const words = FACET_ORDER.map((k) => day.facets[k].oneWord).join(' · ');
  const threads = day.resonanceThreads.map((t) => `↔ ${t.note}`).join('\n');
  return {
    id: targetId(target),
    target,
    status: day.status,
    kicker: `Day ${day.index}`,
    heading: day.theme,
    body: words,
    context: threads || undefined,
    meta: [
      `registers: ${day.registers.join(', ')}`,
      `regions: ${day.regions.join(', ')}`,
      `eras: ${day.eras.join(', ')}`,
      `${day.resonanceThreads.length} resonance thread(s)`,
    ],
  };
}

function facetItem(day: Day, key: FacetKey): FeedItem {
  const facet = day.facets[key];
  const target: JudgmentTarget = {
    level: 'facet',
    day: day.index,
    slug: day.slug,
    facet: key,
    text: facet.title,
  };
  return {
    id: targetId(target),
    target,
    status: day.status,
    kicker: `${FACET_LABELS[key]} · ${day.theme}`,
    heading: facet.title,
    body: facet.body,
    context: `Reveal word: ${facet.oneWord}`,
    meta: [
      `${facet.sources.length} source(s)`,
      ...(facet.entities?.length
        ? [`entities: ${facet.entities.map((e) => e.slug).join(', ')}`]
        : []),
    ],
  };
}

function lineItems(day: Day, key: FacetKey): FeedItem[] {
  const facet = day.facets[key];
  const label = FACET_LABELS[key];
  const items: FeedItem[] = [];

  const oneWordTarget: JudgmentTarget = {
    level: 'oneWord',
    day: day.index,
    slug: day.slug,
    facet: key,
    field: 'oneWord',
    text: facet.oneWord,
  };
  items.push({
    id: targetId(oneWordTarget),
    target: oneWordTarget,
    status: day.status,
    kicker: `${label} · reveal word`,
    heading: facet.oneWord,
    context: `${day.theme} → ${facet.title}`,
    meta: [],
  });

  const titleTarget: JudgmentTarget = {
    level: 'title',
    day: day.index,
    slug: day.slug,
    facet: key,
    field: 'title',
    text: facet.title,
  };
  items.push({
    id: targetId(titleTarget),
    target: titleTarget,
    status: day.status,
    kicker: `${label} · title`,
    heading: facet.title,
    context: day.theme,
    meta: [],
  });

  const sentences = splitSentences(facet.body);
  sentences.forEach((sentence, i) => {
    const target: JudgmentTarget = {
      level: 'sentence',
      day: day.index,
      slug: day.slug,
      facet: key,
      field: 'body',
      sentenceIndex: i,
      text: sentence,
    };
    items.push({
      id: targetId(target),
      target,
      status: day.status,
      kicker: `${label} · sentence ${i + 1}/${sentences.length}`,
      heading: sentence,
      context: facet.title,
      meta: [],
    });
  });

  return items;
}

// Build the full feed for a lens. Days are taken in the order given (the API
// returns them sorted by index); facets always follow the charter's fixed order.
export function buildFeed(days: Day[], lens: Lens): FeedItem[] {
  if (lens === 'day') return days.map(dayItem);
  if (lens === 'facet') return days.flatMap((day) => FACET_ORDER.map((k) => facetItem(day, k)));
  return days.flatMap((day) => FACET_ORDER.flatMap((k) => lineItems(day, k)));
}
