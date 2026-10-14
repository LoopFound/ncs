"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";

type Mode = "signin" | "signup" | "forgot" | "phone";

const inputClass =
  "min-h-12 w-full border border-[var(--border)] bg-[var(--cream)]/30 px-4 py-3 text-base outline-none transition-colors focus:border-[var(--gold)]";
const labelClass =
  "mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--navy)]/70";
const primaryClass =
  "min-h-12 w-full bg-[var(--navy)] px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--gold)] hover:text-[var(--navy)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]";
const textButtonClass =
  "min-h-11 px-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]";

const titles: Record<Mode, [string, string]> = {
  signin: ["Welcome Back", "Sign in to your account"],
  signup: ["Join the Heritage", "Create your boutique account"],
  forgot: ["Reset your password", "We'll email you a reset link"],
  phone: ["Sign in with mobile", "We'll text you a one-time code"],
};

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");

  const preventSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cream)] px-4 py-10 sm:px-6 md:py-16">
      <div aria-hidden="true" className="absolute -right-32 -top-32 size-80 rounded-full bg-[var(--gold)]/5 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-32 size-80 rounded-full bg-[var(--maroon)]/5 blur-3xl" />

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col overflow-hidden border border-[var(--border)] bg-white shadow-2xl md:min-h-[38rem] md:flex-row">
        <div className="relative min-h-64 overflow-hidden bg-[var(--navy)] md:min-h-full md:w-1/2">
          <Image
            src="/images/looks/look-crimson.png"
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, 28rem"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10">
            <p className="mb-3 font-[var(--font-serif)] text-4xl leading-tight text-white">
              Masterpieces
              <br />
              Crafted with Passion.
            </p>
            <p className="mb-0 max-w-sm text-base leading-relaxed text-white/80">
              Track orders, save addresses and your wishlist, and check out faster.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center p-6 sm:p-8 md:w-1/2 lg:p-14">
          <div className="w-full">
            <header className="mb-8 text-center md:text-left">
              <h1 className="mb-2 font-[var(--font-serif)] text-4xl text-[var(--navy)]">
                {titles[mode][0]}
              </h1>
              <p className="mb-0 text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {titles[mode][1]}
              </p>
            </header>

            {mode === "signin" && (
              <form onSubmit={preventSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className={labelClass}>Email address</label>
                  <input id="login-email" type="email" required autoComplete="email" className={inputClass} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className={labelClass}>Password</label>
                    <button type="button" onClick={() => setMode("forgot")} className={textButtonClass}>Forgot?</button>
                  </div>
                  <input id="login-password" type="password" required autoComplete="current-password" className={inputClass} />
                </div>
                <button type="submit" className={primaryClass}>Sign In</button>
              </form>
            )}

            {mode === "signup" && (
              <form onSubmit={preventSubmit} className="space-y-5">
                <div>
                  <label htmlFor="signup-name" className={labelClass}>Full name</label>
                  <input id="signup-name" required minLength={2} autoComplete="name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="signup-email" className={labelClass}>Email address</label>
                  <input id="signup-email" type="email" required autoComplete="email" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="signup-password" className={labelClass}>Password (min. 8 characters)</label>
                  <input id="signup-password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
                </div>
                <button type="submit" className={primaryClass}>Create Account</button>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={preventSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className={labelClass}>Email address</label>
                  <input id="reset-email" type="email" required autoComplete="email" className={inputClass} />
                </div>
                <button type="submit" className={primaryClass}>Email me a reset link</button>
                <button type="button" onClick={() => setMode("signin")} className={`${textButtonClass} w-full`}>Back to sign in</button>
              </form>
            )}

            {mode === "phone" && (
              <form onSubmit={preventSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-phone" className={labelClass}>Mobile number</label>
                  <div className="flex">
                    <span className="flex min-h-12 items-center border border-r-0 border-[var(--border)] bg-[var(--cream)] px-3 text-base text-[var(--navy)]">+91</span>
                    <input id="login-phone" type="tel" inputMode="numeric" required autoComplete="tel-national" className={inputClass} />
                  </div>
                </div>
                <button type="submit" className={primaryClass}>Send code</button>
                <button type="button" onClick={() => setMode("signin")} className={`${textButtonClass} w-full`}>Back to sign in</button>
              </form>
            )}

            {(mode === "signin" || mode === "signup") && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <button
                  type="button"
                  onClick={() => setMode("phone")}
                  className="min-h-12 w-full border border-[var(--navy)] px-4 py-3 text-sm uppercase tracking-[0.16em] text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                >
                  Continue with mobile OTP
                </button>
              </div>
            )}

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center text-base text-[var(--text-muted)]">
              {mode === "signup" ? "Already have an account?" : "New to NCS Santhanam?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className={textButtonClass}
              >
                {mode === "signup" ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
