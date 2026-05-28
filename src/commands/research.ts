export async function research(_args: string[]): Promise<number> {
  process.stderr.write(
    "research: not yet implemented\n\n" +
      "Needs SIWE auth flow first (the /api/research endpoint is wallet-gated).\n" +
      "Track: https://github.com/pyxis-app/cli/issues\n",
  );
  return 2;
}
