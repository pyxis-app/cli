import { API_BASE } from "../config.js";

interface HealthResponse {
  status: "ok" | "degraded" | "down";
  db: "up" | "down";
  dbLatencyMs?: number;
  freeMode?: boolean;
}

export async function health(_args: string[]): Promise<number> {
  const url = `${API_BASE}/api/health`;
  const started = Date.now();
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const rtt = Date.now() - started;
  const body = (await res.json()) as HealthResponse;

  const ok = res.ok && body.status === "ok";
  const icon = ok ? "✓" : body.status === "degraded" ? "~" : "✗";
  process.stdout.write(
    `${icon} ${API_BASE}  status=${body.status}  db=${body.db}` +
      (body.dbLatencyMs != null ? `  dbLatency=${body.dbLatencyMs}ms` : "") +
      (body.freeMode != null ? `  freeMode=${body.freeMode}` : "") +
      `  rtt=${rtt}ms\n`,
  );
  return ok ? 0 : 1;
}
