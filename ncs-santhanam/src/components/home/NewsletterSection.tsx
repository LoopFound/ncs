"use client";

import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/server/actions/engagement";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await subscribeNewsletterAction(email);
      if (r.ok) {
        setState({ ok: true, message: "Almost there — check your inbox to confirm your subscription." });
        setEmail("");
      } else {
        setState({ ok: false, message: r.error });
      }
    });
  };

  return (
    <section className="py-20 lg:py-28 bg-[#09173E] text-white relative overflow-hidden border-t border-[var(--gold)]/10" aria-labelledby="newsletter-heading">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold block mb-2">The Silk Circle</span>
          <h2 id="newsletter-heading" className="font-serif text-3xl md:text-4xl !text-[#FAF7F0] mb-3">
            Join Our Exclusive Atelier
          </h2>
          <p className="!text-white/70 font-light text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Be the first to preview rare wedding weaves, festive releases, and private showroom invitations from Kanchipuram.
          </p>

          {state?.ok ? (
            <div role="status" className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded max-w-md mx-auto">
              <p className="text-sm text-emerald-300 font-medium !mb-0">{state.message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button
                type="submit"
                disabled={pending}
                className="px-7 py-3.5 bg-[#D4AF37] text-[#08153A] text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#F0DA84] transition-colors rounded shadow-md shrink-0 disabled:opacity-60"
              >
                {pending ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          {state && !state.ok && (
            <p role="alert" className="text-red-300 text-xs mt-3">
              {state.message}
            </p>
          )}
          <p className="!text-white/40 text-[11px] mt-4 font-light">We&apos;ll ask you to confirm by email. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}
