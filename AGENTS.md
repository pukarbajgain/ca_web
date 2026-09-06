# AGENTS.md

This repository's instructions for AI agents live in **[`CLAUDE.md`](./CLAUDE.md)**.

Read, in this order, before making any change here:

1. [`../CLAUDE.md`](../CLAUDE.md) — project-level standing instructions,
   conventions and settled decisions. Single source of truth for process.
2. [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — the architecture and product
   foundation. Wins over `../CLAUDE.md` on architectural detail.
3. [`../API_CONTRACT.md`](../API_CONTRACT.md) — what the backend actually
   exposes. **Build only what it says exists.**
4. [`./CLAUDE.md`](./CLAUDE.md) — repo-local rules for `web`.

Ten rules in this repo are non-negotiable and are listed in §1 of
[`./CLAUDE.md`](./CLAUDE.md). The two that are most often broken by accident:

- **Never render a fabricated claim.** Absent facts render nothing.
- **`images.formats` must never include `"image/avif"`** (GHSA-2xp9-vwfh-vxw4).

Verify with `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test &&
pnpm audit --audit-level=high && pnpm build && pnpm e2e`. Do not commit unless
explicitly asked in the same turn.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
