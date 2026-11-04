import { describe, expect, it } from "vitest";
import { isClientDisconnect } from "@/instrumentation-node";

const httpStack = (msg: string) => `Error: ${msg}\n    at abortIncoming (node:_http_server:897:17)\n    at socketOnClose (node:_http_server:890:3)`;
const fromHttp = (msg: string, code?: string) => Object.assign(new Error(msg), { code, stack: httpStack(msg) });

describe("isClientDisconnect", () => {
  it("treats aborted HTTP requests and socket resets as routine", () => {
    expect(isClientDisconnect(fromHttp("aborted", "ECONNRESET"))).toBe(true);
    expect(isClientDisconnect(fromHttp("aborted"))).toBe(true);
    expect(isClientDisconnect(fromHttp("write EPIPE", "EPIPE"))).toBe(true);
    expect(isClientDisconnect(fromHttp("closed", "ERR_STREAM_PREMATURE_CLOSE"))).toBe(true);
  });

  it("keeps resets from database/cache sockets fatal", () => {
    const pg = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET", stack: "Error: read ECONNRESET\n    at TCP.onStreamRead (node:internal/stream_base_commons:216:20)" });
    expect(isClientDisconnect(pg)).toBe(false);
  });

  it("keeps real failures fatal", () => {
    expect(isClientDisconnect(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isClientDisconnect(Object.assign(new Error("listen"), { code: "EADDRINUSE" }))).toBe(false);
    expect(isClientDisconnect(null)).toBe(false);
    expect(isClientDisconnect("aborted")).toBe(false);
  });
});
