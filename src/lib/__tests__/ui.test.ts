import { describe, it, expect, beforeEach } from "vitest";
import { ok, fail, warn, step, meta, isColorEnabled } from "../ui.js";

// Strip ANSI escapes so assertions don't depend on TTY/FORCE_COLOR detection
// (picocolors emits codes when CI sets FORCE_COLOR even though our isColorEnabled
// returns false — the helpers always run picocolors regardless).
// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

describe("ui status helpers", () => {
  beforeEach(() => {
    delete process.env.NO_COLOR;
    delete process.env.PYXIS_NO_BANNER;
  });

  it("ok wraps with green check", () => {
    const out = stripAnsi(ok("Logged in"));
    expect(out).toContain("✓");
    expect(out).toContain("Logged in");
  });

  it("fail wraps with red x", () => {
    const out = stripAnsi(fail("oops"));
    expect(out).toContain("✗");
    expect(out).toContain("oops");
  });

  it("warn uses yellow tilde", () => {
    const out = stripAnsi(warn("careful"));
    expect(out).toContain("~");
    expect(out).toContain("careful");
  });

  it("step uses cyan arrow", () => {
    const out = stripAnsi(step("Opening browser"));
    expect(out).toContain("→");
  });

  it("meta aligns label width 11", () => {
    const out = stripAnsi(meta("wallet", "0xabc"));
    expect(out).toMatch(/wallet\s+0xabc/);
  });

  it("isColorEnabled returns false when NO_COLOR=1", () => {
    process.env.NO_COLOR = "1";
    expect(isColorEnabled()).toBe(false);
  });
});
