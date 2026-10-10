import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser, isStaff } from "@/server/session";
import { signedPrivateUrl } from "@/server/storage";

export const dynamic = "force-dynamic";

/** Redirects the order owner (or staff) to a short-lived signed link for the GST invoice PDF. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, select: { userId: true, invoiceKey: true, number: true } });
  if (!order || (order.userId !== user.id && !isStaff(user))) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!order.invoiceKey) return NextResponse.json({ error: "invoice not ready" }, { status: 404 });
  const url = await signedPrivateUrl(order.invoiceKey, `Invoice-${order.number}.pdf`);
  return NextResponse.redirect(url, { status: 303, headers: { "cache-control": "no-store" } });
}
