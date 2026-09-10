/** The cover that composes itself while the parent fills in the wizard. */
export default function LiveCover({ title, initial, brandName, width = 180 }) {
  return (
    <div
      style={{ width }}
      className="relative aspect-3/4 overflow-hidden rounded-[14px] bg-linear-165 from-accento to-accento-soft shadow-[0_18px_40px_-14px_rgba(67,48,42,0.35)]"
    >
      <div
        className="pointer-events-none absolute inset-2 rounded-[9px] border border-crema/45"
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col items-center justify-between px-3.5 py-4.5 text-center">
        <p className="font-display text-[0.95rem] leading-tight font-semibold text-crema">
          {title}
        </p>
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-crema font-display text-[1.9rem] text-accento"
          aria-hidden="true"
        >
          {initial}
        </div>
        <p className="text-[9px] font-bold tracking-[0.22em] text-crema/85 uppercase">
          {brandName}
        </p>
      </div>
    </div>
  );
}
