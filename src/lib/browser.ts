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
  if (isWsl()) {
    const tries: Array<[string, string[]]> = [
      ["wslview", [url]],
      ["cmd.exe", ["/c", "start", "", url]],
      ["powershell.exe", ["-NoProfile", "-Command", `Start-Process "${url}"`]],
    ];
    for (const [cmd, args] of tries) {
      try {
        await execFileAsync(cmd, args);
        return { opened: true };
      } catch {
        // try next
      }
    }
    return { opened: false };
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
