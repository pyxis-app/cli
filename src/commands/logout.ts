import { clear, load } from "../lib/credentials.js";
import { ok, meta, dim, bold } from "../lib/ui.js";

export async function logout(_args: string[]): Promise<number> {
  const existing = await load();
  await clear();

  process.stdout.write("\n" + ok(bold("Logged out")) + "\n");
  if (existing) {
    process.stdout.write(meta("removed", credentialsDisplay()) + "\n");
    process.stdout.write(
      meta("note", dim("token remains valid server-side up to 24h until natural expiry")) +
        "\n",
    );
  } else {
    process.stdout.write(meta("info", dim("no credentials were present")) + "\n");
  }
  return 0;
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
