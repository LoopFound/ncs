"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, toE164India } from "@/lib/auth-client";

type Mode = "signin" | "signup" | "forgot" | "phone";

interface Props {
  next: string;
  googleEnabled: boolean;
  initialMode: "signin" | "signup";
  verified: boolean;
}

const input = "w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm";
const label = "block text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/70 mb-1";
const primary =
  "w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 disabled:opacity-60";

export default function LoginForm({ next, googleEnabled, initialMode, verified }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(verified ? "Your email is verified — please sign in." : null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const done = () => {
    router.replace(next);
    router.refresh();
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const callbackURL = `/login?verified=1&next=${encodeURIComponent(next)}`;

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (!err) return done();
      if (err.status === 403) {
        setUnverifiedEmail(email);
        setError("Please verify your email first — we sent you a link when you signed up.");
      } else if (err.status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else {
        setError("That email and password don't match our records.");
      }
    });
  };

  const signUp = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error: err } = await authClient.signUp.email({ name, email, password, callbackURL });
      if (err) {
        setError(err.status === 422 || err.message?.toLowerCase().includes("exist") ? "An account with this email already exists. Try signing in." : err.message ?? "Could not create your account.");
        return;
      }
      setInfo(`We've sent a verification link to ${email}. Open it to activate your account.`);
      setMode("signin");
    });
  };

  const resendVerification = () =>
    run(async () => {
      if (!unverifiedEmail) return;
      await authClient.sendVerificationEmail({ email: unverifiedEmail, callbackURL });
      setError(null);
      setInfo(`A new verification link is on its way to ${unverifiedEmail}.`);
    });

  const forgot = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      // Same message whether or not the account exists.
      setInfo("If an account exists for that email, a reset link is on its way.");
    });
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = toE164India(phone);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    void run(async () => {
      const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: normalized });
      if (err) {
        setError(err.status === 429 ? "Too many codes requested. Please wait a minute." : "We couldn't send a code to that number.");
        return;
      }
      setOtpSent(true);
      setInfo(`We've sent a 6-digit code to ${normalized.replace(/^\+91/, "+91 ")}.`);
    });
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: toE164India(phone)!, code: otp.trim() });
      if (err) {
        setError(err.status === 403 ? "Too many incorrect attempts. Request a new code." : "That code is incorrect or has expired.");
        return;
      }
      done();
    });
  };

  const google = () =>
    run(async () => {
      await authClient.signIn.social({ provider: "google", callbackURL: next });
    });

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome Back", "Sign in to your account"],
    signup: ["Join the Heritage", "Create your boutique account"],
    forgot: ["Reset your password", "We'll email you a reset link"],
    phone: ["Sign in with mobile", "We'll text you a one-time code"],
  };

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <h1 className="font-serif !text-3xl text-[var(--navy)] mb-2">{titles[mode][0]}</h1>
        <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest !mb-0">{titles[mode][1]}</p>
      </div>

      {info && (
        <p role="status" className="mb-6 p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-900">
          {info}
        </p>
      )}
      {error && (
        <div role="alert" className="mb-6 p-3 text-sm bg-red-50 border border-red-200 text-red-800">
          {error}
          {unverifiedEmail && mode === "signin" && (
            <button type="button" onClick={() => void resendVerification()} className="block mt-2 underline font-semibold">
              Resend verification email
            </button>
          )}
        </div>
      )}

      {mode === "signin" && (
        <form onSubmit={signIn} className="space-y-5">
          <div>
            <label htmlFor="email" className={label}>
              Email address
            </label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className={label}>
                Password
              </label>
              <button type="button" onClick={() => switchTo("forgot")} className="text-[10px] text-[var(--gold-text)] uppercase tracking-widest hover:underline mb-1">
                Forgot?
              </button>
            </div>
            <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </div>
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      )}

      {mode === "signup" && (
        <form onSubmit={signUp} className="space-y-5">
          <div>
            <label htmlFor="name" className={label}>
              Full name
            </label>
            <input id="name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="email" className={label}>
              Email address
            </label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="password" className={label}>
              Password (min. 8 characters)
            </label>
            <input id="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </div>
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={forgot} className="space-y-5">
          <div>
            <label htmlFor="email" className={label}>
              Email address
            </label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Sending…" : "Email me a reset link"}
          </button>
          <button type="button" onClick={() => switchTo("signin")} className="w-full text-xs uppercase tracking-widest text-[var(--gold-text)] hover:underline">
            Back to sign in
          </button>
        </form>
      )}

      {mode === "phone" && (
        <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-5">
          <div>
            <label htmlFor="phone" className={label}>
              Mobile number
            </label>
            <div className="flex">
              <span className="px-3 py-3 border border-r-0 border-[var(--border)] bg-[var(--cream)] text-sm text-[var(--navy)]">+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel-national"
                maxLength={14}
                value={phone}
                disabled={otpSent}
                onChange={(e) => setPhone(e.target.value)}
                className={input}
              />
            </div>
          </div>
          {otpSent && (
            <div>
              <label htmlFor="otp" className={label}>
                6-digit code
              </label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={`${input} tracking-[0.5em] text-center text-lg`}
              />
            </div>
          )}
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Please wait…" : otpSent ? "Verify & continue" : "Send code"}
          </button>
          {otpSent && (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setInfo(null);
              }}
              className="w-full text-xs uppercase tracking-widest text-[var(--gold-text)] hover:underline"
            >
              Use a different number
            </button>
          )}
        </form>
      )}

      {(mode === "signin" || mode === "signup") && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            <span className="flex-1 h-px bg-[var(--border)]" /> or <span className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <button type="button" onClick={() => switchTo("phone")} className="w-full py-3 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-[0.2em] hover:bg-[var(--navy)] hover:text-white transition-colors">
            Continue with mobile OTP
          </button>
          {googleEnabled && (
            <button type="button" disabled={busy} onClick={() => void google()} className="w-full py-3 border border-[var(--border)] text-[var(--navy)] text-xs uppercase tracking-[0.2em] hover:border-[var(--navy)] transition-colors">
              Continue with Google
            </button>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => switchTo("signin")} className="text-[var(--gold-text)] font-bold uppercase tracking-widest text-[10px] hover:underline">
              Sign in
            </button>
          </>
        ) : (
          <>
            New to NCS Santhanam?{" "}
            <button type="button" onClick={() => switchTo("signup")} className="text-[var(--gold-text)] font-bold uppercase tracking-widest text-[10px] hover:underline">
              Create account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
