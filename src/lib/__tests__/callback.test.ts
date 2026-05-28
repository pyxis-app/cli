import { describe, it, expect } from "vitest";
import { startCallbackServer } from "../callback.js";

describe("callback server", () => {
  it("resolves on matching state + code", async () => {
    const server = await startCallbackServer({ state: "ST", challenge: "CH" });
    const fetched = fetch(`http://127.0.0.1:${server.port}/?state=ST&code=CH`);
    const result = await server.awaitCallback({ timeoutMs: 5_000 });
    expect(result.code).toBe("CH");
    await fetched;
    await server.close();
  });

  it("rejects mismatched state and keeps waiting", async () => {
    const server = await startCallbackServer({ state: "ST", challenge: "CH" });
    const badResp = await fetch(`http://127.0.0.1:${server.port}/?state=WRONG&code=CH`);
    expect(badResp.status).toBe(400);
    const fetched = fetch(`http://127.0.0.1:${server.port}/?state=ST&code=CH`);
    const result = await server.awaitCallback({ timeoutMs: 5_000 });
    expect(result.code).toBe("CH");
    await fetched;
    await server.close();
  });

  it("rejects after timeout when no valid callback arrives", async () => {
    const server = await startCallbackServer({ state: "ST", challenge: "CH" });
    await expect(server.awaitCallback({ timeoutMs: 100 })).rejects.toThrow(/timeout/i);
    await server.close();
  });
});
