import { AuthError, RateLimitError, ServerError } from "./errors.js";
import type { Credentials } from "./credentials.js";

const CLOCK_SKEW_BUFFER_SEC = 60;
const RESEARCH_TIMEOUT_MS = 120_000;

export function isCredentialsFresh(c: Credentials, now = Date.now()): boolean {
  const nowSec = Math.floor(now / 1000);
  return c.exp - nowSec > CLOCK_SKEW_BUFFER_SEC;
}

export interface ResearchResult {
  briefing?: { markdown?: string };
  [key: string]: unknown;
}

export async function callResearch(opts: {
  apiBase: string;
  credentials: Credentials;
  topic: string;
}): Promise<ResearchResult> {
  if (!isCredentialsFresh(opts.credentials)) {
    throw new AuthError("Token expired or about to expire — run `pyxis login`");
  }

  let res: Response;
  try {
    res = await fetch(`${opts.apiBase}/api/research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `pyxis_session=${opts.credentials.token}`,
      },
      body: JSON.stringify({ topic: opts.topic }),
      signal: AbortSignal.timeout(RESEARCH_TIMEOUT_MS),
    });
  } catch (e) {
    if ((e as { name?: string }).name === "TimeoutError") {
      throw new ServerError(`Request timed out after ${RESEARCH_TIMEOUT_MS / 1000}s`, 0);
    }
    throw new ServerError(
      `Could not reach ${opts.apiBase}: ${(e as Error).message}`,
      0,
    );
  }

  if (res.status === 401) {
    throw new AuthError("Authentication failed — run `pyxis login`");
  }
  if (res.status === 429) {
    const ra = res.headers.get("retry-after");
    const seconds = ra ? Number(ra) : null;
    throw new RateLimitError(
      seconds != null
        ? `Rate limited — retry after ${seconds}s`
        : "Rate limited — try again later",
      seconds,
    );
  }
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({ error: "bad request" }))) as { error?: string };
    throw new AuthError(body.error ?? "bad request");
  }
  if (res.status >= 500) {
    throw new ServerError(`Server returned ${res.status}`, res.status);
  }
  if (!res.ok) {
    throw new ServerError(`Unexpected status ${res.status}`, res.status);
  }
  return (await res.json()) as ResearchResult;
}
