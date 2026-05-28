import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { TimeoutError } from "./errors.js";

export interface CallbackResult {
  code: string;
}

export interface CallbackServer {
  port: number;
  awaitCallback(opts: { timeoutMs: number }): Promise<CallbackResult>;
  close(): Promise<void>;
}

export async function startCallbackServer(expected: {
  state: string;
  challenge: string;
}): Promise<CallbackServer> {
  let resolveFn: ((value: CallbackResult) => void) | null = null;
  let rejectFn: ((err: Error) => void) | null = null;

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost`);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    if (state !== expected.state || code !== expected.challenge) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Invalid callback</h1><p>State or code mismatch.</p>");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html><body style="font-family:system-ui;padding:48px;text-align:center">
<h1 style="color:#10b981">✓ Logged in</h1>
<p style="color:#71717a">You can close this tab and return to your terminal.</p>
</body></html>`);
    if (resolveFn) resolveFn({ code });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;

  return {
    port,
    awaitCallback({ timeoutMs }) {
      return new Promise<CallbackResult>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
        setTimeout(() => {
          reject(new TimeoutError(`Callback timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
