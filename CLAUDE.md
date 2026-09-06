# `web` — repo-local context

Public marketing website. Next.js 16 App Router, port 3000.

**Read first, and do not contradict:** `../CLAUDE.md` (process, conventions,
standing instructions), `../ARCHITECTURE.md` (architecture; wins on architectural
detail), `../API_CONTRACT.md` (what the backend actually exposes). This file
holds only what is specific to this repository. `README.md` here is the
human-facing version of the same material.

---

## 1. Non-negotiables

These are not preferences. Each corresponds to a binding rule in the parent
documents, and each is enforced by tooling somewhere — if you find yourself
working around one, stop and re-read the parent document instead.

1. **No authentication of any kind** (`../CLAUDE.md` §3.7). No login, account,
   token or session. The browser never calls the backend. `src/lib/fetcher.ts`
   carries `import "server-only"`, so importing it from a client component is a
   build error.
2. **Never render a fabricated claim** (`../CLAUDE.md` §3.5). Verifiable facts
   are `T | null` in `src/lib/brand.ts`, ship as `null`, and their sections
   render _nothing_ when absent. Adding an empty state, a heading outside the
   early return, or a placeholder figure to any of them is a regression, and
   `src/components/sections/honest-degradation.test.tsx` will fail.
3. **No testimonials, client logos or star ratings.** Regulatory hold. Not
   built, not mounted, not behind a flag.
4. **`images.formats` is `["image/webp"]`. Never add `"image/avif"`**
   (GHSA-2xp9-vwfh-vxw4 — `../CLAUDE.md` §4.1). The comment in
   `next.config.ts` explains why; keep it there.
5. **Versions are pinned exactly**: `next@16.3.4`, `react@19.2.8`,
   `react-dom@19.2.8`. Never scaffold or upgrade onto an unaudited version;
   re-check the Next.js security blog before any framework bump.
6. **No Axios** (`../ARCHITECTURE.md` §O.2). Native `fetch` with
   `next: { revalidate, tags }`. ESLint bans the import.
7. **No component names an image path.** Typed descriptors from
   `src/lib/assets.ts`; `next/image` is importable only from
   `src/components/media/`.
8. **No hardcoded internal path.** `src/lib/routes.ts`.
9. **No mock or seed fallback layer** (`../ARCHITECTURE.md` §O.18). A fallback
   hides real failures. Absence renders nothing.
10. **`src/app/globals.css` is a verbatim copy of `../shared/globals.css`.**
    Do not edit it here. Edit the shared file, re-copy, and keep `admin` in step.
    Public-site-only decoration goes in `src/app/site.css`.

---

## 2. Where things live

| Concern             | File                           | Note                                           |
| ------------------- | ------------------------------ | ---------------------------------------------- |
| Firm identity       | `src/lib/brand.ts`             | The only place. Everything reads from here.    |
| Internal paths      | `src/lib/routes.ts`            | Drives `sitemap.ts` and `robots.ts`.           |
| Navigation          | `src/config/nav.ts`            | Has a test. Only routes that exist.            |
| Image slots         | `src/lib/image-slots.ts`       | Locked ratio + intrinsic size per slot.        |
| Image registry      | `src/lib/assets.ts`            | Typed descriptors. `data-placeholder`.         |
| Brand mark geometry | `src/lib/brand-marks.ts`       | One source; inline JSX + static SVG.           |
| API access          | `src/lib/fetcher.ts`           | Server-only. `revalidate` + `tags`.            |
| Cache tags          | `src/lib/revalidation-tags.ts` | **This app owns the entity→tag map.**          |
| UI strings          | `src/lib/vocabulary.ts`        | i18n-ready by construction. No raw enums.      |
| Structured data     | `src/lib/seo.ts`               | Typed builders. Absent fact → absent property. |
| Editorial copy      | `src/config/content.ts`        | Moves to the CMS in Phase 4.                   |
| Design system       | `/design` route                | Tokens, components, viewport switcher.         |

---

## 3. Conventions specific to this repo

- **Pages are shells.** `app/(marketing)/page.tsx` is a list of `<Section/>`.
  Substance lives in `components/sections/` and `features/`.
- **Sections** render `<section aria-labelledby="…">` + `<Container>` +
  `<SectionHeading>`, and return `null` when they have nothing to show.
- **`sizes` is a required prop** on `AssetImage`, and it must match the grid the
  caller actually uses. A wrong `sizes` is worse than none.
- **Segment config exports must be literals.** `export const revalidate = 300`,
  not an imported constant — Next statically analyses these and rejects a
  binding ("Invalid segment configuration export detected").
- **Arbitrary Tailwind colours need the data-type hint**: `text-[color:var(--x)]`,
  never `text-[var(--x)]`, which Tailwind resolves as a _font size_ and which
  silently drops the colour. `src/lib/tailwind-usage.test.ts` guards this.
- **`cn` is `extendTailwindMerge`, not the default.** tailwind-merge does not
  know the tokenised type scale and files `text-body-large` under _text-colour_,
  discarding any real colour paired with it. See the comment in
  `src/lib/utils.ts`; `src/lib/utils.test.ts` pins the case that broke.
- **Scroll-driven entrance animates transform only.** Under a view timeline
  opacity is a function of scroll position, so a partially-scrolled element sits
  at a partial opacity indefinitely and fails the contrast gate. See `site.css`.
- **Every section is a `<Section>`** (`components/layout/section.tsx`). It owns
  the ground, the vertical rhythm and the `aria-labelledby` region. The
  `surface`/`muted` alternation is set at the call site in `page.tsx`, because
  several sections render nothing — the rhythm has to be right for what actually
  renders, not for the full list.
- **Dimmed text still has to meet 4.5:1.** `aria-hidden` does not exempt it; the
  index numerals shipped at `opacity-40`–`opacity-60` and measured 2.0–3.0:1.
  `opacity-80` over `text-on-surface-variant` clears the floor on every ground
  the site uses. A true watermark (the step numerals in `how-we-work`) is drawn
  as an `<svg><text>` instead, because it genuinely is a decorative graphic and
  the same number is available as real text beside it — see the comment there.
- **Never `waitForLoadState("networkidle")` in Playwright.** It never settles
  against a production `next start` (ISR keeps work in flight) and times out on
  pages that are fine. `e2e/responsive.spec.ts` waits on `load` +
  `document.fonts.ready` + one frame instead.
- Files kebab-case, components PascalCase, hooks `useX`, alias `@/* → src/*`.
- `types.ts` mirrors the wire in snake_case; mapping happens in `api.ts`.
- Dense "why" comments. Explain the decision and what breaks without it, not
  what the line does.

---

## 4. Verification

Run all of these before calling anything done. A subagent's report is a claim,
not evidence (`../CLAUDE.md` §2.3).

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
pnpm audit --audit-level=high
pnpm build
pnpm e2e            # 390 / 768 / 1280 / 1920 · overflow + axe
```

`pnpm typecheck`, `pnpm lint` and `pnpm test` need no `.env`; `pnpm build` and
`pnpm e2e` do (`cp .env.example .env.local`). CI supplies them as literals and
sets `SKIP_ENV_VALIDATION` nowhere — the point is to exercise the same parsing
path production uses.

The build succeeds with the backend down; the settings fetch degrades to `null`
and logs a warning. That is expected, not a failure.

---

## 5. Adding things

**A new content type reaching the site:**

1. Confirm the endpoint exists in `../API_CONTRACT.md`. If it does not, say
   "not currently supported by the backend" and stop.
2. Add the type to `REVALIDATABLE_TYPES` and `COLLECTION_TAGS` in
   `src/lib/revalidation-tags.ts`.
3. Add `features/<f>/{types,api,service}.ts`, using the tag from that map at the
   fetch site so the webhook and the fetch cannot drift.
4. Add the route to `src/lib/routes.ts` (and `staticRoutes` if it is indexable).
5. Add the section, returning `null` when empty.
6. Extend the JSON-LD builders if the entity has a schema.org type.

**A new image slot:** `image-slots.ts` → `assets.ts` → a composition in
`scripts/generate-placeholders.ts` → `pnpm assets:generate`. The ratio test in
`src/lib/assets.test.ts` will fail if the intrinsic size contradicts the ratio.
