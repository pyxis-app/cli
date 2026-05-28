# `@pyxis-labs/cli`

Pyxis on the command line. Run Web3 research briefings from your terminal — same 5-agent pipeline as [usepyxis.com](https://usepyxis.com).

> **Status:** early scaffold (v0.0.1). Only `pyxis health` is wired up. `pyxis research` lands next once the SIWE auth flow ships.

## Install

```bash
npm i -g @pyxis-labs/cli
# or run without install
npx @pyxis-labs/cli health
```

Requires Node.js ≥ 18.17.

## Usage

```bash
pyxis <command> [options]
```

| Command | Status | What it does |
|---|---|---|
| `pyxis health` | ✅ shipped | Ping `usepyxis.com/api/health` — confirms API + DB are up |
| `pyxis research <topic>` | 🚧 planned | Run a briefing — 5-agent pipeline against any token/chain/protocol/narrative |

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `PYXIS_API_BASE` | `https://usepyxis.com` | Override for self-hosted or staging |

## Development

```bash
git clone git@github.com:pyxis-app/cli.git
cd cli
npm install
npm run dev -- health        # run from source via tsx
npm run build                # emit dist/
node dist/index.js health    # run built artifact
```

## License

MIT © Pyxis Authors. App itself (`pyxis-app/pyxis`) is AGPL-3.0 — this CLI is intentionally MIT so it can be embedded freely.
