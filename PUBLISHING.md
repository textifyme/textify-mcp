# Publishing @textifyme/mcp (founder-gated)

Not shipped in the tarball (see `.npmignore`). Steps for the founder once the npm org exists.

## Prereqs
- npm org **@textifyme** created (https://www.npmjs.com/org/create). Bare `textify` is taken —
  the scope is mandatory.
- `npm login` as a member of the org.
- (Recommended) 2FA enabled → publish with `--otp`.
- The hosted server `https://mcp.textify.me/mcp` should be live so the package actually works, but
  the package can be published before the human-reviewed directory listings.

## Verify locally first
```bash
cd npm-shim
npm install          # pulls mcp-remote
node bin/textify-mcp.mjs --help
# smoke test against local wrangler dev:
#   pnpm --filter @app/mcp run dev    (serves http://localhost:8788)
TEXTIFY_MCP_URL=http://localhost:8788/mcp TEXTIFY_API_KEY=sk_test node bin/textify-mcp.mjs
npm pack --dry-run   # confirm only bin/, README.md, LICENSE are included
```

## Publish
```bash
npm publish --access public          # scoped packages default to restricted; --access public is required
# with 2FA: npm publish --access public --otp=123456
```

## Version pin note
`mcp-remote` moves fast (latest observed 0.1.38, 2026-07). The dep is `^0.1.38`. Re-verify the
bridge still accepts `--header "Authorization: Bearer <key>"` on major bumps; if its CLI surface
changes, update `bin/textify-mcp.mjs` accordingly and cut a patch release.

## After publish
- Confirm `npx -y @textifyme/mcp --help` works from a clean machine.
- Update the Glama / mcp.so listings' install snippet if the version scheme changes.
