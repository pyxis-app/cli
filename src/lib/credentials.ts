import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { mkdir, writeFile, readFile, chmod, unlink } from "node:fs/promises";

export interface Credentials {
  token: string;
  wallet: string;
  exp: number;
  savedAt: number;
}

let pathOverride: string | null = null;

export function _setPathForTests(p: string | null): void {
  pathOverride = p;
}

export function credentialsPath(): string {
  if (pathOverride) return pathOverride;
  if (platform() === "win32") {
    const appdata = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appdata, "pyxis", "credentials");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(xdg, "pyxis", "credentials");
}

export async function save(c: Credentials): Promise<void> {
  const p = credentialsPath();
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(c, null, 2) + "\n", "utf8");
  if (platform() !== "win32") {
    await chmod(p, 0o600);
  }
}

export async function load(): Promise<Credentials | null> {
  try {
    const raw = await readFile(credentialsPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.token === "string" &&
      typeof parsed?.wallet === "string" &&
      typeof parsed?.exp === "number" &&
      typeof parsed?.savedAt === "number"
    ) {
      return parsed as Credentials;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clear(): Promise<void> {
  try {
    await unlink(credentialsPath());
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}
