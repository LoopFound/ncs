import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/server/session";
import { MAX_IMAGE_BYTES, putProductImage } from "@/server/storage";
import { audit } from "@/server/audit";
import { logger, errorInfo } from "@/server/logger";

export const dynamic = "force-dynamic";

/** Staff-only image upload: validates the file by its magic bytes, then stores it in the public bucket. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE_BYTES + 64 * 1024) return NextResponse.json({ error: "Images must be under 8 MB." }, { status: 413 });

  try {
    const form = await request.formData();
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
