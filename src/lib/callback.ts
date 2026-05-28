import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { TimeoutError } from "./errors.js";

const SUCCESS_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>pyxis · signed in</title>
<style>
  :root {
    --bg:#0a0c10; --panel:#11141a; --border:#1f2630;
    --fg:#d6deeb; --dim:#7a8aa3; --cyan:#4fc3f7;
    --green:#4ade80; --accent:#67e8f9;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{
    background:var(--bg);color:var(--fg);min-height:100vh;
    font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    display:flex;align-items:center;justify-content:center;padding:24px;
  }
  .card{
    background:var(--panel);border:1px solid var(--border);border-radius:14px;
    padding:48px 40px;max-width:540px;width:100%;text-align:center;
    box-shadow:0 24px 60px -24px rgba(0,0,0,0.6),
               0 0 0 1px rgba(79,195,247,0.04);
  }
  .logo{color:var(--cyan);font-size:11px;line-height:1.05;white-space:pre;margin-bottom:10px}
  .tagline{color:var(--dim);font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:36px}
  .check{
    width:64px;height:64px;border-radius:50%;
    background:rgba(74,222,128,0.10);
    color:var(--green);font-size:32px;font-weight:700;
    display:inline-flex;align-items:center;justify-content:center;
    margin-bottom:18px;
    box-shadow:0 0 0 1px rgba(74,222,128,0.18),
               0 0 24px -4px rgba(74,222,128,0.25);
  }
  h1{font-size:22px;color:#fff;margin-bottom:10px;font-weight:600;letter-spacing:-0.01em}
  p{color:var(--dim);font-size:13px;line-height:1.65;max-width:380px;margin:0 auto}
  .row{
    margin-top:28px;padding-top:24px;border-top:1px solid var(--border);
    color:var(--accent);font-size:10px;letter-spacing:0.3em;text-transform:uppercase;
  }
  .row .key{color:var(--dim);margin-right:8px}
  @media (prefers-reduced-motion:no-preference){
    .check{animation:pulse 2.4s ease-in-out infinite}
    @keyframes pulse{
      0%,100%{box-shadow:0 0 0 1px rgba(74,222,128,0.18),0 0 24px -4px rgba(74,222,128,0.25)}
      50%{box-shadow:0 0 0 1px rgba(74,222,128,0.35),0 0 32px -2px rgba(74,222,128,0.4)}
    }
  }
</style>
</head>
<body>
  <div class="card" role="status" aria-live="polite">
    <div class="logo">██████╗ ██╗   ██╗██╗  ██╗██╗███████╗
██╔══██╗╚██╗ ██╔╝╚██╗██╔╝██║██╔════╝
██████╔╝ ╚████╔╝  ╚███╔╝ ██║███████╗
██╔═══╝   ╚██╔╝   ██╔██╗ ██║╚════██║
██║        ██║   ██╔╝ ██╗██║███████║
╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝</div>
    <div class="tagline">the research swarm</div>
    <div class="check" aria-hidden="true">✓</div>
    <h1>Signed in</h1>
    <p>The CLI received your token. You can close this tab and return to your terminal to start researching.</p>
    <div class="row"><span class="key">next</span><span id="hint">type pyxis research &lt;topic&gt;</span></div>
  </div>
  <script>
    // Try to auto-close (only works if the tab was opened by JS, which it
    // wasn't — but harmless to attempt). Otherwise the user closes manually.
    setTimeout(() => { try { window.close(); } catch {} }, 4000);
  </script>
</body>
</html>`;

export interface CallbackResult {
  code: string;
}

export interface CallbackServer {
  port: number;
  awaitCallback(opts: { timeoutMs: number }): Promise<CallbackResult>;
  close(): Promise<void>;
}

export async function startCallbackServer(expected: {
  state: string;
  challenge: string;
}): Promise<CallbackServer> {
  let resolveFn: ((value: CallbackResult) => void) | null = null;
  let rejectFn: ((err: Error) => void) | null = null;

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost`);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    if (state !== expected.state || code !== expected.challenge) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Invalid callback</h1><p>State or code mismatch.</p>");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(SUCCESS_PAGE);
    if (resolveFn) resolveFn({ code });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;

  return {
    port,
    awaitCallback({ timeoutMs }) {
      return new Promise<CallbackResult>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
        setTimeout(() => {
          reject(new TimeoutError(`Callback timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
