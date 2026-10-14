import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "./env";

let client: S3Client | undefined;

function s3(): S3Client {
  if (client) return client;
  const e = env();
  client = new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT,
    forcePathStyle: e.S3_FORCE_PATH_STYLE,
    // On AWS (ECS task role) credentials come from the default provider chain.
    credentials:
      e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY }
        : undefined,
  });
  return client;
}

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function publicUrl(key: string): string {
  return `${env().S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

/** Detects the real image type from magic bytes (never trust the declared Content-Type). */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (b.length >= 12 && ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return "image/avif";
  return null;
}

/** Stores a validated product image in the public bucket and returns its key and URL. */
export async function putProductImage(bytes: Uint8Array) {
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be under 8 MB.");
  const type = sniffImageType(bytes);
  if (!type) throw new Error("Only JPEG, PNG, WebP or AVIF images are allowed.");
  const key = `products/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ALLOWED_IMAGE_TYPES[type]}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: publicUrl(key) };
}

export async function deletePublicObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
}

export async function putPrivateObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(
    new PutObjectCommand({ Bucket: env().S3_PRIVATE_BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}

/** Short-lived download link for a private object (e.g. a GST invoice). */
export async function signedPrivateUrl(key: string, filename: string, expiresIn = 300) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: env().S3_PRIVATE_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"`,
    }),
    { expiresIn },
  );
}

/** Creates the buckets if missing (local / VPS object stores). On AWS, Terraform owns them. */
export async function ensureBuckets() {
  for (const Bucket of [env().S3_BUCKET, env().S3_PRIVATE_BUCKET]) {
    try {
      await s3().send(new HeadBucketCommand({ Bucket }));
    } catch {
      await s3().send(new CreateBucketCommand({ Bucket }));
    }
  }
}

export async function storageHealthy(): Promise<boolean> {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: env().S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
}
