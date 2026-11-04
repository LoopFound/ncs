"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "@/context/SessionContext";
import {
  requestPasswordReset,
  resendVerificationEmail,
  sendPhoneOtp,
  signInWithEmail,
  signUpWithEmail,
  verifyPhoneOtp,
} from "@/lib/api";
import { toIndianE164 } from "@/lib/checkout";
import { safeNext, verifiedLoginPath } from "@/lib/safe-next";

type Mode = "signin" | "signup" | "forgot" | "phone";

const inputClass =
  "min-h-12 w-full border border-[var(--border)] bg-[var(--cream)]/30 px-4 py-3 text-base outline-none transition-colors focus:border-[var(--gold)]";
const labelClass =
  "mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--navy)]/70";
const primaryClass =
  "min-h-12 w-full bg-[var(--navy)] px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--gold)] hover:text-[var(--navy)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:cursor-wait disabled:opacity-70";
const textButtonClass =
  "min-h-11 px-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-60";
const infoClass = "mb-6 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900";
const errorClass = "mb-6 border border-[var(--maroon)]/30 bg-[var(--maroon)]/5 p-3 text-sm text-[var(--maroon)]";

const titles: Record<Mode, [string, string]> = {
  signin: ["Welcome Back", "Sign in to your account"],
  signup: ["Join the Heritage", "Create your boutique account"],
  forgot: ["Reset your password", "We'll email you a reset link"],
  phone: ["Sign in with mobile", "We'll text you a one-time code"],
};

// Reads ?next= at the moment it is needed, so the page itself can stay statically rendered.
function nextPath() {
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

function VerifiedNotice() {
  const verified = useSearchParams().get("verified");
  if (!verified) return null;
  return (
    <p role="status" className={infoClass}>
      Your email is verified. Please sign in to continue.
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [mode, setModeState] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpPhone, setOtpPhone] = useState<string | null>(null);

  const setMode = (next: Mode) => {
    setModeState(next);
    setError(null);
    setInfo(null);
    setUnverifiedEmail(null);
  };

  const run = async (fn: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  };

  const finishSignIn = async () => {
    await refresh();
    router.replace(nextPath());
  };

  // After verifying, the customer returns here (signed out on this host) and the sanitised ?next=
  // is carried through, so signing in then continues to where they were going.
  const verifyCallbackURL = () =>
    `${window.location.origin}${verifiedLoginPath(new URLSearchParams(window.location.search).get("next"))}`;

  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      const result = await signInWithEmail({ email: email.trim(), password });
      if (result.ok) return finishSignIn();
      if (result.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email.trim());
        setError("Please verify your email first. We sent you a link when you signed up.");
      } else if (result.status === 401 || result.code === "INVALID_EMAIL_OR_PASSWORD") {
        setError("That email and password don't match our records.");
      } else {
        setError(result.error);
      }
    });
  };

  const handleResend = () =>
    void run(async () => {
      if (!unverifiedEmail) return;
      const result = await resendVerificationEmail({ email: unverifiedEmail, callbackURL: verifyCallbackURL() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo(`A new verification link is on its way to ${unverifiedEmail}.`);
      setUnverifiedEmail(null);
    });

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      const address = email.trim();
      const result = await signUpWithEmail({ name: name.trim(), email: address, password, callbackURL: verifyCallbackURL() });
      if (!result.ok) {
        const exists = result.status === 422 || result.code === "USER_ALREADY_EXISTS" || /exist/i.test(result.error);
        setError(exists ? "An account with this email already exists. Try signing in." : result.error);
        return;
      }
      setPassword("");
      setModeState("signin");
      setInfo(`Check your email: we've sent a verification link to ${address}. Open it to activate your account, then sign in.`);
    });
  };

  const handleForgot = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      // The reset link in the email opens the backend's /reset-password page.
      const result = await requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Same message whether or not the account exists.
      setInfo("If an account exists for that email, a reset link is on its way.");
    });
  };

  const handleSendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = toIndianE164(phone);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    void run(async () => {
      const result = await sendPhoneOtp(normalized);
      if (!result.ok) {
        setError(result.status === 429 ? "Too many codes requested. Please wait a minute and try again." : result.error);
        return;
      }
      setOtp("");
      setOtpPhone(normalized);
      setInfo(`We've sent a 6-digit code to ${normalized.replace(/^\+91/, "+91 ")}.`);
    });
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpPhone) return;
    void run(async () => {
      const result = await verifyPhoneOtp({ phoneNumber: otpPhone, code: otp.trim() });
      if (result.ok) return finishSignIn();
      if (result.status === 403) setError("Too many incorrect attempts. Please request a new code.");
      else if (result.status === 400 || result.status === 401) setError("That code is incorrect or has expired.");
      else setError(result.error);
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 md:py-16">
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
            <p className="mb-3 font-serif text-4xl leading-tight text-white">
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
              <h1 className="mb-2 font-serif text-4xl text-[var(--navy)]">
                {titles[mode][0]}
              </h1>
              <p className="mb-0 text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {titles[mode][1]}
              </p>
            </header>

            <Suspense fallback={null}>
              <VerifiedNotice />
            </Suspense>

            {info && (
              <p role="status" className={infoClass}>
                {info}
              </p>
            )}
            {error && (
              <div role="alert" className={errorClass}>
                <p className="mb-0">{error}</p>
                {unverifiedEmail && (
                  <button type="button" onClick={handleResend} disabled={pending} className={`${textButtonClass} -ml-2 mt-1`}>
                    Resend verification link
                  </button>
                )}
              </div>
            )}

            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className={labelClass}>Email address</label>
                  <input id="login-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className={labelClass}>Password</label>
                    <button type="button" onClick={() => setMode("forgot")} className={textButtonClass}>Forgot?</button>
                  </div>
                  <input id="login-password" name="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </div>
                <button type="submit" disabled={pending} className={primaryClass}>{pending ? "Signing In..." : "Sign In"}</button>
              </form>
            )}

            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <label htmlFor="signup-name" className={labelClass}>Full name</label>
                  <input id="signup-name" name="name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="signup-email" className={labelClass}>Email address</label>
                  <input id="signup-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="signup-password" className={labelClass}>Password (min. 8 characters)</label>
                  <input id="signup-password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </div>
                <button type="submit" disabled={pending} className={primaryClass}>{pending ? "Creating Account..." : "Create Account"}</button>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className={labelClass}>Email address</label>
                  <input id="reset-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <button type="submit" disabled={pending} className={primaryClass}>{pending ? "Sending..." : "Email me a reset link"}</button>
                <button type="button" onClick={() => setMode("signin")} className={`${textButtonClass} w-full`}>Back to sign in</button>
              </form>
            )}

            {mode === "phone" && !otpPhone && (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label htmlFor="login-phone" className={labelClass}>Mobile number</label>
                  <div className="flex">
                    <span className="flex min-h-12 items-center border border-r-0 border-[var(--border)] bg-[var(--cream)] px-3 text-base text-[var(--navy)]">+91</span>
                    <input id="login-phone" name="phone" type="tel" inputMode="numeric" required autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <button type="submit" disabled={pending} className={primaryClass}>{pending ? "Sending Code..." : "Send code"}</button>
                <button type="button" onClick={() => setMode("signin")} className={`${textButtonClass} w-full`}>Back to sign in</button>
              </form>
            )}

            {mode === "phone" && otpPhone && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label htmlFor="login-otp" className={labelClass}>6-digit code</label>
                  <input
                    id="login-otp"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} tracking-[0.4em]`}
                  />
                </div>
                <button type="submit" disabled={pending} className={primaryClass}>{pending ? "Verifying..." : "Verify & sign in"}</button>
                <button type="button" onClick={() => { setOtpPhone(null); setOtp(""); setError(null); setInfo(null); }} className={`${textButtonClass} w-full`}>
                  Change number or resend code
                </button>
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
