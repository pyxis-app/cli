import { describe, it, expect, beforeEach } from "vitest";
import { ok, fail, warn, step, meta, isColorEnabled } from "../ui.js";

describe("ui status helpers", () => {
  beforeEach(() => {
    delete process.env.NO_COLOR;
    delete process.env.PYXIS_NO_BANNER;
  });

  it("ok wraps with green check", () => {
    const out = ok("Logged in");
    expect(out).toContain("✓");
    expect(out).toContain("Logged in");
  });

  it("fail wraps with red x", () => {
    const out = fail("oops");
    expect(out).toContain("✗");
    expect(out).toContain("oops");
  });

  it("warn uses yellow tilde", () => {
    const out = warn("careful");
    expect(out).toContain("~");
    expect(out).toContain("careful");
  });

  it("step uses cyan arrow", () => {
    const out = step("Opening browser");
    expect(out).toContain("→");
  });

  it("meta aligns label width 11", () => {
    const out = meta("wallet", "0xabc");
    expect(out).toMatch(/wallet\s+0xabc/);
  });

  it("isColorEnabled returns false when NO_COLOR=1", () => {
    process.env.NO_COLOR = "1";
    expect(isColorEnabled()).toBe(false);
  });
});
