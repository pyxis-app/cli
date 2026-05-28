import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callResearch, isCredentialsFresh } from "../api.js";
import { AuthError, RateLimitError, ServerError } from "../errors.js";

const FRESH_CREDS = {
  token: "jwt",
  wallet: "0xabc",
  exp: Math.floor(Date.now() / 1000) + 3600,
  savedAt: Date.now(),
};
const EXPIRED_CREDS = {
  ...FRESH_CREDS,
  exp: Math.floor(Date.now() / 1000) - 60,
};

describe("isCredentialsFresh", () => {
  it("true when exp is well in the future", () => {
    expect(isCredentialsFresh(FRESH_CREDS)).toBe(true);
  });
  it("false when exp is in the past", () => {
    expect(isCredentialsFresh(EXPIRED_CREDS)).toBe(false);
  });
  it("false when exp is within the 60s buffer", () => {
    expect(isCredentialsFresh({ ...FRESH_CREDS, exp: Math.floor(Date.now() / 1000) + 30 })).toBe(false);
  });
});

describe("callResearch error mapping", () => {
  const origFetch = global.fetch;
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { global.fetch = origFetch; });

  it("throws AuthError when client-side credentials are stale", async () => {
    await expect(
      callResearch({ apiBase: "http://x", credentials: EXPIRED_CREDS, topic: "btc" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("throws AuthError on 401 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "sign in required" }), { status: 401 }),
    );
    await expect(
      callResearch({ apiBase: "http://x", credentials: FRESH_CREDS, topic: "btc" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("throws RateLimitError on 429 with Retry-After", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("", { status: 429, headers: { "retry-after": "30" } }),
    );
    await expect(
      callResearch({ apiBase: "http://x", credentials: FRESH_CREDS, topic: "btc" }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("throws ServerError on 500", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("oops", { status: 500 }),
    );
    await expect(
      callResearch({ apiBase: "http://x", credentials: FRESH_CREDS, topic: "btc" }),
    ).rejects.toBeInstanceOf(ServerError);
  });

  it("returns parsed result on 200", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ briefing: { markdown: "# Hello" } }), { status: 200 }),
    );
    const result = await callResearch({ apiBase: "http://x", credentials: FRESH_CREDS, topic: "btc" });
    expect(result.briefing?.markdown).toBe("# Hello");
  });
});
