# @textifyme/mcp

Local (stdio) shim for the **hosted Textify MCP server** — turn anything into text from any MCP
client. It bridges a local `command`-style MCP config to the hosted streamable-HTTP endpoint at
`https://mcp.textify.me/mcp`, with your API key pre-wired.

> Prefer a **remote connector**? If your client supports remote MCP servers directly (Claude.ai
> "Add custom connector"), just add `https://mcp.textify.me/mcp` — you don't need this package.
> This shim exists for clients that only accept a local command.

## Tools

| Tool | What it does |
|---|---|
| `youtube_transcript` | Fetch a YouTube video's published captions by URL or ID. |
| `transcribe_audio` | Transcribe an audio/video file (URL or upload) to timestamped text. |
| `ocr_image` | Extract text from a photo, screenshot, or scan (incl. handwriting). |
| `file_to_markdown` | Convert a DOCX / PPTX / XLSX / EPUB to clean Markdown (PDF not supported). |
| `webpage_to_markdown` | Fetch a public URL and return clean Markdown. |

Every account gets **100 free credits/month**. All calls debit the same credit ledger as the
Textify REST API and website — one balance, one accounting.

## Setup

Get an API key at <https://textify.me/docs>.

### Claude Desktop / Claude Code / Cursor

```json
{
  "mcpServers": {
    "textify": {
      "command": "npx",
      "args": ["-y", "@textifyme/mcp"],
      "env": { "TEXTIFY_API_KEY": "sk_your_key" }
    }
  }
}
```

`TEXTIFY_API_KEY` is required — tool calls that cost credits authenticate with it as
`Authorization: Bearer <key>`. Get a free key (100 credits/month) at <https://textify.me/account>.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `TEXTIFY_API_KEY` | — | API key; sent as `Authorization: Bearer <key>`. Required for credit-costing tools. |
| `TEXTIFY_MCP_URL` | `https://mcp.textify.me/mcp` | Endpoint override. Set to `http://localhost:8788/mcp` to test against a local `wrangler dev`. |

Extra CLI args are forwarded to the underlying [`mcp-remote`](https://www.npmjs.com/package/mcp-remote)
bridge (e.g. `--debug`).

## How it works

The shim is a thin wrapper: it resolves the bundled `mcp-remote` proxy and launches it against the
Textify endpoint with your auth header attached, then pipes MCP over stdio. No Textify credentials
are stored on disk by this package; the key lives only in your client's env.

## Local development

```bash
# in this package dir
npm install
TEXTIFY_MCP_URL=http://localhost:8788/mcp TEXTIFY_API_KEY=sk_test node bin/textify-mcp.mjs
# (run `pnpm --filter @app/mcp run dev` in the Textify monorepo to serve localhost:8788)
```

## License

MIT — see [LICENSE](./LICENSE).
