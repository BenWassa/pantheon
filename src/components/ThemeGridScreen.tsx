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

  function handleOpen(key: FacetKey) {
    setOpenKey(key);
    readFacet(key);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <DayHeader index={day.index} theme={day.theme} facetsRead={facetsRead} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {FACET_ORDER.map((key, i) => (
          <FacetTile
            key={key}
            facetKey={key}
            index={i}
            oneWord={day.facets[key].oneWord}
            read={Boolean(facetsRead[key])}
            onOpen={() => handleOpen(key)}
          />
        ))}
      </div>

      {openFacet ? <FacetDetail facet={openFacet} onClose={() => setOpenKey(null)} /> : null}
    </div>
  );
}
