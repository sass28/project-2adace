export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-foreground">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <circle cx="12" cy="12" r="4" fill="var(--solar)" />
          <path d="M4 18 L12 6 L20 18" fill="none" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-semibold tracking-[0.18em]">NEXORA</span>
          <span className="block text-[9px] font-medium tracking-[0.32em] text-muted-foreground">ENERGY</span>
        </span>
      )}
    </span>
  );
}
