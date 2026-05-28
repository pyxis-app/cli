import { randomBytes, createHash } from "node:crypto";
import { startCallbackServer } from "./callback.js";
import { openBrowser } from "./browser.js";
import { AuthError, LoginCancelledError, TimeoutError } from "./errors.js";
import type { Credentials } from "./credentials.js";

export interface LoginOptions {
  apiBase: string;
  timeoutMs?: number;
  onUrl?: (url: string) => void;
  onWaiting?: () => void;
}

export async function performLogin(opts: LoginOptions): Promise<Credentials> {
  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const server = await startCallbackServer({ state, challenge });
  const url = `${opts.apiBase}/cli-auth?state=${state}&port=${server.port}&challenge=${encodeURIComponent(challenge)}`;
  opts.onUrl?.(url);

  await openBrowser(url);
  opts.onWaiting?.();

  let callback;
  try {
    callback = await server.awaitCallback({ timeoutMs: opts.timeoutMs ?? 5 * 60_000 });
  } catch (e) {
    await server.close();
    if (e instanceof TimeoutError) {
      throw new LoginCancelledError("Login cancelled or timed out — run `pyxis login` again");
    }
    throw e;
  }
  await server.close();

  const res = await fetch(`${opts.apiBase}/api/cli/token`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: callback.code, verifier }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new AuthError(`Token exchange failed (HTTP ${res.status})`);
  }
  const payload = (await res.json()) as { token: string; wallet: string; exp: number };
  return {
    token: payload.token,
    wallet: payload.wallet,
    exp: payload.exp,
    savedAt: Date.now(),
  };
}
