# `@pyxis-labs/cli`

Pyxis on the command line. Run Web3 research briefings from your terminal — same 5-agent pipeline as [usepyxis.com](https://usepyxis.com).

## Install

```bash
npm i -g @pyxis-labs/cli
# or run without install
npx @pyxis-labs/cli health
```

Requires Node.js ≥ 18.17.

## Quickstart

```bash
pyxis login                           # opens browser, sign in with wallet
pyxis research "ondo finance Q2"      # 5-agent briefing in your terminal
pyxis status                          # check session
pyxis logout                          # clear local credentials
```

## Commands

| Command | What it does |
|---|---|
| `pyxis login` | Browser-callback sign-in. Token saved to `~/.config/pyxis/credentials` (mode 0600). Valid 24h. |
| `pyxis logout` | Removes local credentials. (Token remains valid server-side until natural expiry.) |
| `pyxis status` | Shows current wallet + expiry. Exit 1 if not logged in. |
| `pyxis research <topic>` | Runs the 5-agent research pipeline against your topic. 30-90s typical. |
| `pyxis health` | Pings `/api/health` — confirms API + DB are up. |
| `pyxis help`, `--version` | Self-explanatory. |

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `PYXIS_API_BASE` | `https://usepyxis.com` | Override for self-hosted or staging |
| `NO_COLOR` | unset | When `1`, disable all ANSI colors and the banner |
| `PYXIS_NO_BANNER` | unset | When `1`, suppress only the login banner (keep colors) |
| `XDG_CONFIG_HOME` | `~/.config` | POSIX credentials directory base |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (not logged in, invalid topic, token expired) |
| 2 | Server / network error (5xx, timeout, rate-limited) |
| 130 | Interrupted (Ctrl+C) |

## Development

```bash
git clone git@github.com:pyxis-app/cli.git
cd cli
npm install
npm test                       # vitest
npm run dev -- health          # run from source via tsx
npm run build                  # emit dist/
node dist/index.js login       # run built artifact
```

## Related

| Project | What it is |
|---|---|
| [usepyxis.com](https://www.usepyxis.com) | Live web app — same 5-agent pipeline, rendered briefings |
| [docs.usepyxis.com](https://docs.usepyxis.com) | Docs site — methodology, sources, FAQ |
| [`pyxis-app/pyxis`](https://github.com/pyxis-app/pyxis) | Main app source (AGPL-3.0) |
| [`@pyxis-labs/web3-sources`](https://github.com/pyxis-app/web3-sources) | Sibling: typed TS clients for the 13 data sources Pyxis pulls from |
| [@pyxisbase](https://x.com/pyxisbase) on X | Project updates, build-in-public |

## License

MIT © Pyxis Authors. App itself (`pyxis-app/pyxis`) is AGPL-3.0 — this CLI is intentionally MIT so it can be embedded freely.
