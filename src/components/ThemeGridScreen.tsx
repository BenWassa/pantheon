import { useEffect, useState } from 'react';
import type { Day, Facet, FacetKey } from '@/content/types';
import { FACET_ORDER } from '@/content/types';
import { useAppStore } from '@/store/useAppStore';
import { DayHeader } from './DayHeader';
import { FacetTile } from './FacetTile';
import { FacetDetail } from './FacetDetail';

export function ThemeGridScreen({ day }: { day: Day }) {
  const openCurrentDay = useAppStore((s) => s.openCurrentDay);
  const readFacet = useAppStore((s) => s.readFacet);
  const records = useAppStore((s) => s.persisted.records);
  const currentIndex = useAppStore((s) => s.persisted.currentDayIndex);

  const [openKey, setOpenKey] = useState<FacetKey | null>(null);

  // Opening the grid for a day is the open-rate signal.
  useEffect(() => {
    openCurrentDay();
  }, [openCurrentDay, currentIndex]);

  const facetsRead = records[day.index]?.facetsRead ?? {};
  const openFacet: Facet | null = openKey ? day.facets[openKey] : null;

  const openIndex = openKey ? FACET_ORDER.indexOf(openKey) : -1;
  const prevKey = openIndex > 0 ? FACET_ORDER[openIndex - 1] : null;
  const nextKey = openIndex >= 0 && openIndex < FACET_ORDER.length - 1 ? FACET_ORDER[openIndex + 1] : null;

  function handleOpen(key: FacetKey) {
    setOpenKey(key);
  }

  function handleClose() {
    if (openKey) readFacet(openKey);
    setOpenKey(null);
  }

  function handleNav(key: FacetKey) {
    if (openKey) readFacet(openKey);
    setOpenKey(key);
  }

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col px-4 pb-4 pt-10">
      <DayHeader index={day.index} theme={day.theme} facetsRead={facetsRead} />

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-3">
        {FACET_ORDER.map((key, i) => (
          <FacetTile
            key={key}
            facetKey={key}
            index={i}
            image={day.facets[key].image}
            oneWord={day.facets[key].oneWord}
            read={Boolean(facetsRead[key])}
            onOpen={() => handleOpen(key)}
          />
        ))}
      </div>

      {openFacet ? (
        <FacetDetail
          facet={openFacet}
          onClose={handleClose}
          onPrev={prevKey ? () => handleNav(prevKey) : null}
          onNext={nextKey ? () => handleNav(nextKey) : null}
          prevWord={prevKey ? day.facets[prevKey].oneWord : null}
          nextWord={nextKey ? day.facets[nextKey].oneWord : null}
        />
      ) : null}
    </div>
  );
}
