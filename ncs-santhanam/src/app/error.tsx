"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center pt-28 pb-20 px-6">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-6 text-amber-700">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-3">
          Error Encountered
        </span>

        <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
          A Momentary Pause in <br />
          <span className="italic text-[var(--gold-text)] font-normal">the Weave</span>
        </h1>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto mb-8">
          We encountered an unexpected interruption while rendering this page. Our atelier has been alerted. You can attempt to refresh the weave or return to safety.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 shadow-md"
          >
            Retry Loading
          </button>
          <Link
            href="/"
            className="px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[var(--navy)] hover:text-white transition-all duration-300"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
