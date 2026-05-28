import { load } from "../lib/credentials.js";
import { ok, fail, meta, dim, cyan, bold } from "../lib/ui.js";

export async function status(_args: string[]): Promise<number> {
  const creds = await load();
  if (!creds) {
    process.stdout.write("\n" + fail(bold("Not logged in")) + "\n");
    process.stdout.write(meta("hint", dim("run `pyxis login`")) + "\n");
    return 1;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const remainingSec = creds.exp - nowSec;
  if (remainingSec <= 0) {
    process.stdout.write("\n" + fail(bold("Session expired")) + "\n");
    process.stdout.write(meta("wallet", cyan(shortWallet(creds.wallet))) + "\n");
    process.stdout.write(meta("hint", dim("run `pyxis login` to refresh")) + "\n");
    return 1;
  }

  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const expiresAt = new Date(creds.exp * 1000).toUTCString();

  process.stdout.write("\n" + ok(bold("Logged in")) + "\n");
  process.stdout.write(meta("wallet", cyan(shortWallet(creds.wallet))) + "\n");
  process.stdout.write(
    meta(
      "expires",
      `${expiresAt} ${dim(`(${hours}h${minutes.toString().padStart(2, "0")}m remaining)`)}`,
    ) + "\n",
  );
  process.stdout.write(meta("stored at", credentialsDisplay()) + "\n");
  return 0;
}

function shortWallet(w: string): string {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function credentialsDisplay(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (process.platform === "win32") {
    return process.env.APPDATA
      ? `${process.env.APPDATA}\\pyxis\\credentials`
      : "%APPDATA%\\pyxis\\credentials";
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? `${home}/.config`;
  return xdg.replace(home, "~") + "/pyxis/credentials";
}
