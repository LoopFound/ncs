import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/server/session";
import { MAX_IMAGE_BYTES, putProductImage } from "@/server/storage";
import { audit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { logger, errorInfo } from "@/server/logger";

export const dynamic = "force-dynamic";

async function readCapped(request: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

/** Staff-only image upload: validates the file by its magic bytes, then stores it in the public bucket. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rl = await rateLimit("admin-upload", user!.id, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const limit = MAX_IMAGE_BYTES + 64 * 1024;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > limit) return NextResponse.json({ error: "Images must be under 8 MB." }, { status: 413 });

  // Content-Length can be absent or lie (chunked bodies): count bytes as they stream and abort at the cap.
  const capped = await readCapped(request, limit);
  if (!capped) return NextResponse.json({ error: "Images must be under 8 MB." }, { status: 413 });

  try {
    const form = await new Response(capped, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    const stored = await putProductImage(new Uint8Array(await file.arrayBuffer()));
    await audit(user!.id, "upload.image", "media", stored.key, { name: file.name, size: file.size });
    return NextResponse.json(stored);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    logger.warn({ ...errorInfo(err) }, "image upload rejected");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
