import { performLogin } from "../lib/auth.js";
import { save } from "../lib/credentials.js";
import { printBanner, ok, step, meta, dim, bright, cyan, bold, spin, type Spinner } from "../lib/ui.js";
import { API_BASE } from "../config.js";
import { LoginCancelledError, AuthError } from "../lib/errors.js";

export async function login(_args: string[]): Promise<number> {
  printBanner();

  let spinner: Spinner | undefined;
  try {
    let urlPrinted = false;
    const creds = await performLogin({
      apiBase: API_BASE,
      onUrl(url) {
        const short = url.replace(/^https?:\/\//, "").split("?")[0] ?? url;
        process.stdout.write(step(`Opening ${bright(short)} in browser`) + "\n");
        urlPrinted = true;
      },
      onWaiting() {
        spinner = spin(`Waiting for sign-in...  ${dim("(Ctrl+C to cancel)")}`);
      },
    });
    if (!urlPrinted) {
      process.stdout.write(step("Opening usepyxis.com/cli-auth in browser") + "\n");
    }
    spinner?.stop();

    await save(creds);
    const expiresIn = formatRelative(creds.exp);
    const expiresAt = new Date(creds.exp * 1000).toUTCString();

    process.stdout.write("\n" + ok(bold("Logged in")) + "\n");
    process.stdout.write(meta("wallet", cyan(shortWallet(creds.wallet))) + "\n");
    process.stdout.write(meta("expires", `${expiresAt} ${dim(`(${expiresIn})`)}`) + "\n");
    process.stdout.write(meta("stored at", credentialsPathStr()) + "\n");
    return 0;
  } catch (e) {
    spinner?.stop();
    if (e instanceof LoginCancelledError) {
      process.stderr.write("\n" + step(e.message) + "\n");
      return 1;
    }
    if (e instanceof AuthError) {
      process.stderr.write("\n" + step(`Login failed: ${e.message}`) + "\n");
      return 1;
    }
    throw e;
  }
}

function shortWallet(w: string): string {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function formatRelative(expUnixSec: number): string {
  const seconds = expUnixSec - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return "expired";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h${minutes.toString().padStart(2, "0")}m`;
}

function credentialsPathStr(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (process.platform === "win32") {
    return process.env.APPDATA
      ? `${process.env.APPDATA}\\pyxis\\credentials`
      : "%APPDATA%\\pyxis\\credentials";
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? `${home}/.config`;
  return xdg.replace(home, "~") + "/pyxis/credentials";
}
