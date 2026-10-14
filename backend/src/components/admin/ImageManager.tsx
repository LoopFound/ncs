"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProductImageAction, deleteProductImageAction, moveProductImageAction } from "@/server/actions/admin/catalog";
import { btn } from "./ui";

interface Img {
  id: string;
  url: string;
  alt: string | null;
}

/** Uploads, orders and removes product images (first image = primary). */
export default function ImageManager({ productId, images }: { productId: string; images: Img[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body });
        const data = (await res.json()) as { url?: string; key?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
        const saved = await addProductImageAction(productId, { url: data.url, key: data.key ?? null });
        if (!saved.ok) throw new Error(saved.error);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Failed");
      router.refresh();
    });

  return (
    <section className="bg-white border border-[var(--border)] p-6">
      <h2 className="font-serif !text-xl text-[var(--navy)] mb-4">Images</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <li key={img.id} className="border border-[var(--border)]">
            <div className="aspect-[3/4] bg-[var(--greige)]">
              <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between p-2 text-xs">
              <span>{i === 0 ? "Primary" : `#${i + 1}`}</span>
              <span className="flex gap-2">
                <button type="button" disabled={pending || i === 0} onClick={() => act(() => moveProductImageAction(img.id, "up"))} aria-label="Move earlier" className="disabled:opacity-30">
                  ←
                </button>
                <button type="button" disabled={pending || i === images.length - 1} onClick={() => act(() => moveProductImageAction(img.id, "down"))} aria-label="Move later" className="disabled:opacity-30">
                  →
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => window.confirm("Remove this image?") && act(() => deleteProductImageAction(img.id))}
                  className="text-[var(--maroon)]"
                >
                  Remove
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-4">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => void upload(e.target.files)} className="hidden" id="image-upload" />
        <label htmlFor="image-upload" className={`${btn.secondary} cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading…" : "+ Upload images"}
        </label>
        <span className="text-xs text-[var(--text-muted)]">JPEG, PNG, WebP or AVIF · up to 8 MB each</span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}
    </section>
  );
}
