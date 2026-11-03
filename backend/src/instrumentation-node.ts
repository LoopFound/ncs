import { env } from "./server/env";
import { logger, errorInfo } from "./server/logger";

/** Fails fast on misconfiguration instead of erroring on the first request. */
export function registerNode() {
  env();
  const g = globalThis as unknown as { __ncsProcessHandlers?: boolean };
  if (!g.__ncsProcessHandlers) {
    g.__ncsProcessHandlers = true;
    process.on("unhandledRejection", (reason) => logger.error(errorInfo(reason), "unhandled promise rejection"));
    process.on("uncaughtException", (err) => {
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
