import { env } from "./server/env";
import { logger, errorInfo } from "./server/logger";

const CLIENT_DISCONNECT_CODES = new Set(["ECONNRESET", "EPIPE", "ECONNABORTED", "ERR_STREAM_PREMATURE_CLOSE"]);

/**
 * A browser closing its connection mid-request surfaces as an uncaught "aborted"/ECONNRESET error.
 * That is routine traffic, not process corruption, so it must never take the server down.
 */
export function isClientDisconnect(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const { code, message, stack } = err as { code?: unknown; message?: unknown; stack?: unknown };
  const looksLikeDisconnect = (typeof code === "string" && CLIENT_DISCONNECT_CODES.has(code)) || message === "aborted";
  // Only the HTTP server's own sockets qualify: a reset from Postgres/Redis/SMTP must stay fatal.
  return looksLikeDisconnect && typeof stack === "string" && /_http_(server|incoming|outgoing)/.test(stack);
}

/** Fails fast on misconfiguration instead of erroring on the first request. */
export function registerNode() {
  env();
  const g = globalThis as unknown as { __ncsProcessHandlers?: boolean };
  if (!g.__ncsProcessHandlers) {
    g.__ncsProcessHandlers = true;
    process.on("unhandledRejection", (reason) => logger.error(errorInfo(reason), "unhandled promise rejection"));
    process.on("uncaughtException", (err) => {
      if (isClientDisconnect(err)) {
        logger.warn(errorInfo(err), "client disconnected mid-request");
        return;
      }
      logger.fatal(errorInfo(err), "uncaught exception; exiting so the orchestrator restarts the process");
      // Give the logger a moment to flush, then let Docker/ECS restart us in a clean state.
      setTimeout(() => process.exit(1), 500).unref();
    });
  }
  logger.info("web server configuration validated");
}

export function reportRequestError(err: unknown, request: { path: string; method: string }) {
  logger.error({ ...errorInfo(err), path: request.path, method: request.method }, "unhandled request error");
}
