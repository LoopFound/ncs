import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import { isPlaceholderEmail } from "@/server/auth";
import { CheckoutError, quoteCheckout } from "@/server/services/checkout";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
  const defaultAddress = addresses[0];

  let quote;
  try {
    quote = await quoteCheckout(user, { pincode: defaultAddress?.pincode ?? null, paymentMethod: "RAZORPAY" });
  } catch (err) {
    if (!(err instanceof CheckoutError)) throw err;
    return (
      <div className="pt-32 pb-24 min-h-[70vh] bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white border border-[var(--border)]">
          <h1 className="font-serif !text-3xl text-[var(--navy)] mb-3">{err.message}</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Add your chosen silks to the bag before checking out.</p>
          <Link href="/cart" className="inline-block px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold">
            Review bag
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)] min-h-screen">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
        <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/cart" className="hover:text-[var(--gold-text)]">
            Bag
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Checkout</span>
        </nav>
        <h1 className="font-serif !text-4xl text-[var(--navy)] mb-10">Delivery & Payment</h1>
        <CheckoutForm
          initialQuote={quote}
          addresses={addresses.map((a) => ({
            id: a.id,
            fullName: a.fullName,
            phone: a.phone,
            line1: a.line1,
            line2: a.line2,
            landmark: a.landmark,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
          }))}
          needsEmail={isPlaceholderEmail(user.email)}
          defaultName={user.name}
          defaultPhone={user.phoneNumber ?? ""}
        />
      </div>
    </div>
  );
}
