import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function openBrowser(url: string): Promise<{ opened: boolean }> {
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
