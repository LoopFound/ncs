export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-[var(--cream)] flex flex-col items-center justify-center p-6">
      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[var(--gold)]/20 animate-ping opacity-30" />
        {/* Spinning Loom Ring */}
        <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] border-t-[var(--gold)] animate-spin" />
        {/* Core Dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--navy)]" />
      </div>
      <p className="font-[var(--font-serif)] text-lg text-[var(--navy)] tracking-wide">
        Unfolding the Loom...
      </p>
      <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold mt-1">
        NCS Santhanam • Kanchipuram
      </span>
    </div>
  );
}
