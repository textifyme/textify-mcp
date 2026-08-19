#!/usr/bin/env node
/**
 * @textifyme/mcp — local (stdio) shim for the hosted Textify MCP server.
 *
 * MCP clients that can only launch a local command (Claude Desktop / Claude Code / Cursor
 * "command + args" config) can't speak to a remote streamable-HTTP server directly. This shim
 * bridges stdio <-> the hosted endpoint by delegating to `mcp-remote`, the community-standard
 * stdio<->HTTP proxy, with the Textify URL and auth pre-wired.
 *
 * Config:
 *   TEXTIFY_API_KEY   your Textify API key (from https://textify.me/account). Required for tool
 *                     calls that cost credits; it is sent as `Authorization: Bearer <key>`.
 *   TEXTIFY_MCP_URL   override the endpoint (default https://mcp.textify.me/mcp). Point at
 *                     http://localhost:8788/mcp to test against `wrangler dev`.
 *
 * Any extra CLI args are forwarded to mcp-remote (e.g. --transport, --header, --debug).
 *
 * Usage in a client config:
 *   {
 *     "mcpServers": {
 *       "textify": {
 *         "command": "npx",
 *         "args": ["-y", "@textifyme/mcp"],
 *         "env": { "TEXTIFY_API_KEY": "sk_..." }
 *       }
 *     }
 *   }
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const DEFAULT_URL = "https://mcp.textify.me/mcp";
const url = process.env.TEXTIFY_MCP_URL || DEFAULT_URL;
const apiKey = process.env.TEXTIFY_API_KEY;
const passthrough = process.argv.slice(2);

if (passthrough.includes("--help") || passthrough.includes("-h")) {
  process.stdout.write(
    [
      "@textifyme/mcp — local stdio shim for the hosted Textify MCP server.",
      "",
      "Env:",
      "  TEXTIFY_API_KEY   API key from https://textify.me/account (sent as Bearer). Required for",
      "                    tool calls that cost credits.",
      `  TEXTIFY_MCP_URL   endpoint override (default ${DEFAULT_URL}).`,
      "",
      "Run it as your MCP client's server command; it speaks MCP over stdio.",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

// Resolve the mcp-remote CLI entry point from our own dependency tree (no reliance on a global).
let mcpRemoteBin;
try {
  const pkgJsonPath = require.resolve("mcp-remote/package.json");
  const pkg = require("mcp-remote/package.json");
  const binField = pkg.bin;
  const rel = typeof binField === "string" ? binField : binField["mcp-remote"] ?? Object.values(binField)[0];
  mcpRemoteBin = path.join(path.dirname(pkgJsonPath), rel);
} catch (err) {
  process.stderr.write(
    "textify-mcp: could not locate the 'mcp-remote' dependency. Reinstall @textifyme/mcp " +
      "(npm i -g @textifyme/mcp) or run via `npx -y @textifyme/mcp`.\n" +
      String(err && err.message ? err.message : err) +
      "\n",
  );
  process.exit(1);
}

const args = [mcpRemoteBin, url];
if (apiKey) {
  // We build argv directly (no shell), so the space in the header value is safe.
  args.push("--header", `Authorization: Bearer ${apiKey}`);
}
args.push(...passthrough);

const child = spawn(process.execPath, args, { stdio: "inherit" });

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    // Re-raise the signal so the parent sees the real termination cause.
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  process.stderr.write(`textify-mcp: failed to start mcp-remote: ${err.message}\n`);
  process.exit(1);
});
