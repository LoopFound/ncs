import { env } from "./server/env";
import { logger, errorInfo } from "./server/logger";

/** Fails fast on misconfiguration instead of erroring on the first request. */
export function registerNode() {
  env();
  logger.info("web server configuration validated");
}

export function reportRequestError(err: unknown, request: { path: string; method: string }) {
  logger.error({ ...errorInfo(err), path: request.path, method: request.method }, "unhandled request error");
}
