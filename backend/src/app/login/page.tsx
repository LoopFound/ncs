import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { features } from "@/server/env";
import { safeNext } from "@/lib/safe-redirect";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="min-h-screen bg-[var(--cream)] pt-32 pb-24 flex items-center justify-center overflow-hidden relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto bg-white shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[var(--border)]">
          <div className="md:w-1/2 relative min-h-[260px] md:min-h-full bg-[var(--navy)] overflow-hidden">
            <img src="/images/looks/look-crimson.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-transparent to-transparent" />
            <div className="absolute inset-0 p-10 flex flex-col justify-end">
              <p className="font-serif !text-4xl !text-white mb-4 leading-tight">
                Masterpieces <br />
                Crafted with Passion.
              </p>
              <p className="!text-white/70 text-sm leading-relaxed tracking-wide !mb-0">
                Track orders, save addresses and your wishlist, and check out faster.
              </p>
            </div>
          </div>
          <div className="md:w-1/2 p-8 lg:p-14">
            <LoginForm next={next} googleEnabled={features.google()} initialMode={sp.mode === "signup" ? "signup" : "signin"} verified={sp.verified === "1"} />
          </div>
        </div>
      </div>
    </div>
  );
}
