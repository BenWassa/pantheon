export function DayHeader({ index, theme }: { index: number; theme: string }) {
  return (
    <header className="mb-10 text-center">
      <p className="text-[0.7rem] uppercase tracking-widest2 text-ink-faint">Day {index}</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{theme}</h1>
    </header>
  );
}
