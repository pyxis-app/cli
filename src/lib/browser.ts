import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

const execFileAsync = promisify(execFile);

function isWsl(): boolean {
  if (process.platform !== "linux") return false;
  if (process.env.WSL_DISTRO_NAME) return true;
  try {
    const proc = readFileSync("/proc/version", "utf8");
    return /microsoft|wsl/i.test(proc);
  } catch {
    return false;
  }
}

export async function openBrowser(url: string): Promise<{ opened: boolean }> {
  // WSL2 → reach into Windows to launch the actual user-facing browser.
  // We deliberately use PowerShell Start-Process instead of `cmd.exe /c start`
  // or `wslview` because cmd.exe re-parses the command line and treats `&` in
  // a URL as a command separator, which fragments URLs like
  // /cli-auth?state=X&port=Y&challenge=Z into multiple browser-launch attempts
  // (one with the full URL, one with just ?state=X). Start-Process keeps the
  // URL atomic.
  if (isWsl()) {
    const safeUrl = url.replace(/"/g, '\\"');
    try {
      await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-Command",
        `Start-Process "${safeUrl}"`,
      ]);
      return { opened: true };
    } catch {
      return { opened: false };
    }
  }

  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    await execFileAsync(cmd, args);
    return { opened: true };
  } catch {
    return { opened: false };
  }
}
