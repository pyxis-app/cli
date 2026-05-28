import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, stat, readFile, writeFile } from "node:fs/promises";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { save, load, clear, _setPathForTests } from "../credentials.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "pyxis-cred-"));
  _setPathForTests(join(dir, "credentials"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  _setPathForTests(null);
});

const sample = {
  token: "jwt-here",
  wallet: "0xabc",
  exp: 1234567890,
  savedAt: Date.now(),
};

describe("credentials.save", () => {
  it("writes JSON to the path", async () => {
    await save(sample);
    const raw = await readFile(join(dir, "credentials"), "utf8");
    expect(JSON.parse(raw)).toEqual(sample);
  });

  it("sets mode 0600 on POSIX", async () => {
    if (platform() === "win32") return;
    await save(sample);
    const s = await stat(join(dir, "credentials"));
    expect(s.mode & 0o777).toBe(0o600);
  });
});

describe("credentials.load", () => {
  it("returns null when file missing", async () => {
    const result = await load();
    expect(result).toBeNull();
  });

  it("returns parsed object when file exists", async () => {
    await save(sample);
    const result = await load();
    expect(result).toEqual(sample);
  });

  it("returns null on malformed JSON", async () => {
    await writeFile(join(dir, "credentials"), "not json", "utf8");
    const result = await load();
    expect(result).toBeNull();
  });

  it("returns null when JSON shape does not match Credentials", async () => {
    await writeFile(join(dir, "credentials"), JSON.stringify({ token: "only" }), "utf8");
    const result = await load();
    expect(result).toBeNull();
  });
});

describe("credentials.clear", () => {
  it("removes the file (idempotent)", async () => {
    await save(sample);
    await clear();
    expect(await load()).toBeNull();
    await expect(clear()).resolves.toBeUndefined();
  });
});
