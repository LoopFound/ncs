"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6 text-[#0B1B4D] font-sans">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg border border-[#0B1B4D]/10">
          <h2 className="text-3xl font-serif text-[#0B1B4D] mb-3">System Interruption</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            A critical error occurred while preparing your experience. Please refresh to continue.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#0B1B4D] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A227] hover:text-[#0B1B4D] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
