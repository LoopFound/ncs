import { NextResponse } from "next/server";
import { resolveCartIdentity } from "@/server/cart-session";
import { getCart } from "@/server/services/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const cart = await getCart(await resolveCartIdentity({ mutable: true }));
  return NextResponse.json(cart, { headers: { "cache-control": "private, no-store" } });
}
