#!/usr/bin/env node
import { health } from "./commands/health.js";
import { research } from "./commands/research.js";

const USAGE = `pyxis — Web3 research from your terminal

Usage:
  pyxis <command> [options]

Commands:
  research <topic>   Run a research briefing (5-agent pipeline)
  health             Check usepyxis.com API status
  help               Show this message

Options:
  -v, --version      Print version
  -h, --help         Show help

Docs: https://docs.usepyxis.com
`;

async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;

  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (cmd === "-v" || cmd === "--version") {
    const { version } = await import("../package.json", { with: { type: "json" } }).then(
      (m) => m.default,
    );
    process.stdout.write(`${version}\n`);
    return 0;
  }

  switch (cmd) {
    case "health":
      return health(rest);
    case "research":
      return research(rest);
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n${USAGE}`);
      return 1;
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  },
);
