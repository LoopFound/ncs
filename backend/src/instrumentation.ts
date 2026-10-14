/**
 * Runs once when the Next.js server starts (not during `next build`).
 * Node-only work lives in instrumentation-node.ts so it never reaches the Edge bundle.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    registerNode();
  }
}

export async function onRequestError(err: unknown, request: { path: string; method: string }) {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportRequestError } = await import("./instrumentation-node");
    reportRequestError(err, request);
  }
}
