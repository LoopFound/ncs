import pino from "pino";

/**
 * Structured JSON logs to stdout (collected by Docker / CloudWatch).
 * Secrets and personal data are redacted by path.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: process.env.NCS_SERVICE ?? (process.argv.some((a) => /worker/.test(a)) ? "worker" : "web") },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "*.password",
      "*.*.password",
      "token",
      "*.token",
      "*.*.token",
      "otp",
      "*.otp",
      "*.*.otp",
      "email",
      "*.email",
      "*.*.email",
      "phone",
      "*.phone",
      "*.*.phone",
      "authkey",
      "*.authkey",
      "*.*.authkey",
      "secret",
      "*.secret",
      "*.*.secret",
      "razorpay_payment_id",
      "*.razorpay_payment_id",
      "*.*.razorpay_payment_id",
      "razorpay_signature",
      "*.razorpay_signature",
      "*.*.razorpay_signature",
      "headers.authorization",
      "headers.cookie",
      "*.headers.authorization",
      "*.headers.cookie",
    ],
    censor: "[redacted]",
  },
});

export function errorInfo(err: unknown) {
  if (err instanceof Error) return { err: { message: err.message, name: err.name, stack: err.stack } };
  return { err: { message: String(err) } };
}
