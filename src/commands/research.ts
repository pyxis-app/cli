import { load } from "../lib/credentials.js";
import { callResearch } from "../lib/api.js";
import { ok, fail, step, meta, dim, cyan, bright, bold, spin, type Spinner } from "../lib/ui.js";
import { API_BASE } from "../config.js";
import { AuthError, RateLimitError, ServerError } from "../lib/errors.js";

export async function research(args: string[]): Promise<number> {
  const topic = args.join(" ").trim();
  if (!topic) {
    process.stderr.write(fail("Usage: pyxis research <topic>") + "\n");
    return 1;
  }
  if (topic.length < 3 || topic.length > 200) {
    process.stderr.write(fail("Topic must be 3-200 characters") + "\n");
    return 1;
  }

  const creds = await load();
  if (!creds) {
    process.stderr.write(fail("Not logged in") + "\n");
    process.stderr.write(meta("hint", dim("run `pyxis login` first")) + "\n");
    return 1;
  }

  process.stdout.write("\n");
  process.stdout.write(
    step(`Running as ${cyan(shortWallet(creds.wallet))} on ${bright("usepyxis.com")}`) + "\n",
  );
  const spinner: Spinner = spin("Researching…");
  const startedAt = Date.now();

  let result;
  try {
    result = await callResearch({ apiBase: API_BASE, credentials: creds, topic });
  } catch (e) {
    spinner.stop();
    if (e instanceof AuthError) {
      process.stderr.write("\n" + fail(e.message) + "\n");
      return 1;
    }
    if (e instanceof RateLimitError) {
      process.stderr.write("\n" + fail(e.message) + "\n");
      return 2;
    }
    if (e instanceof ServerError) {
      process.stderr.write("\n" + fail(e.message) + "\n");
      return 2;
    }
    throw e;
  }

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  spinner.stop();
  process.stdout.write("\n" + ok(bold(`Done in ${elapsedSec}s.`)) + "\n\n");

  const markdown = (result?.briefing as { markdown?: string } | undefined)?.markdown;
  if (typeof markdown === "string" && markdown.length > 0) {
    process.stdout.write(markdown);
    if (!markdown.endsWith("\n")) process.stdout.write("\n");
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
  return 0;
}

function shortWallet(w: string): string {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}
