import c from "picocolors";
import cliSpinners from "cli-spinners";

export function isColorEnabled(): boolean {
  if (process.env.NO_COLOR === "1") return false;
  return process.stdout.isTTY === true;
}

export function isBannerEnabled(): boolean {
  if (process.env.PYXIS_NO_BANNER === "1") return false;
  return isColorEnabled();
}

export const ok    = (s: string) => `  ${c.green("✓")}  ${s}`;
export const fail  = (s: string) => `  ${c.red("✗")}  ${s}`;
export const warn  = (s: string) => `  ${c.yellow("~")}  ${s}`;
export const step  = (s: string) => `  ${c.cyan("→")}  ${s}`;
export const meta  = (label: string, value: string) =>
  `     ${c.dim(label.padEnd(11))}${value}`;

export const dim    = (s: string) => c.dim(s);
export const bold   = (s: string) => c.bold(s);
export const cyan   = (s: string) => c.cyan(s);
export const bright = (s: string) => c.cyanBright(s);

const BANNER = [
  "██████╗ ██╗   ██╗██╗  ██╗██╗███████╗",
  "██╔══██╗╚██╗ ██╔╝╚██╗██╔╝██║██╔════╝",
  "██████╔╝ ╚████╔╝  ╚███╔╝ ██║███████╗",
  "██╔═══╝   ╚██╔╝   ██╔██╗ ██║╚════██║",
  "██║        ██║   ██╔╝ ██╗██║███████║",
  "╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝",
];

export function printBanner(): void {
  if (!isBannerEnabled()) return;
  for (const line of BANNER) {
    process.stdout.write(`  ${c.cyan(line)}\n`);
  }
  process.stdout.write(`  ${c.dim("the research swarm")}\n\n`);
}

export interface Spinner {
  stop(finalLine?: string): void;
}

export function spin(label: string): Spinner {
  if (!isColorEnabled()) {
    process.stdout.write(`  ${label}\n`);
    return {
      stop(finalLine) {
        if (finalLine) process.stdout.write(`${finalLine}\n`);
      },
    };
  }
  const frames = cliSpinners.dots.frames;
  const intervalMs = cliSpinners.dots.interval;
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r  ${c.cyan(frames[i % frames.length] ?? "")}  ${label}`);
    i++;
  }, intervalMs);
  return {
    stop(finalLine) {
      clearInterval(timer);
      process.stdout.write(`\r\x1b[K`);
      if (finalLine) process.stdout.write(`${finalLine}\n`);
    },
  };
}
