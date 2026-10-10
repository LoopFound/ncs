"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-6">
      <div className="aspect-[3/4] bg-white relative overflow-hidden shadow-sm">
        {current ? (
          <img src={current.url} alt={current.alt} className="w-full h-full object-cover" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--greige)]">
            <span className="text-[var(--navy)]/40 text-xs tracking-widest uppercase italic">{name}</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4" role="group" aria-label="Product images">
          {images.map((img, idx) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Show image ${idx + 1} of ${images.length}`}
              aria-pressed={active === idx}
              className={`aspect-[3/4] bg-white relative overflow-hidden border-2 transition-all ${
                active === idx ? "border-[var(--gold)]" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
