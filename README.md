# CA Platform — `web`

The public marketing website. Next.js 16 App Router, port **3000**.

Sibling repositories: [`../admin`](../admin) (CMS console, 3001) and
[`../backend`](../backend) (FastAPI, 8000). Architecture and standing
instructions live one directory up in
[`../CLAUDE.md`](../CLAUDE.md), [`../ARCHITECTURE.md`](../ARCHITECTURE.md) and
[`../API_CONTRACT.md`](../API_CONTRACT.md); this file covers only what is
specific to running and changing this repository.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local     # then fill in the values
pnpm dev                       # http://localhost:3000
```

The site builds and runs with the backend down: the one live read
(`GET /api/v1/public/settings`) degrades to "no settings", and every section
that depends on it renders nothing. That is the intended behaviour, not a
workaround — see **Honest degradation** below.

| Script                              | What it does                                           |
| ----------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                          | Dev server on :3000                                    |
| `pnpm build` / `pnpm start`         | Production build (`output: standalone`) / serve it     |
| `pnpm lint` · `pnpm lint:fix`       | ESLint 9 flat config                                   |
| `pnpm typecheck`                    | `tsc --noEmit`                                         |
| `pnpm format` · `pnpm format:check` | Prettier (+ `prettier-plugin-tailwindcss`)             |
| `pnpm test` · `pnpm test:watch`     | Vitest + Testing Library                               |
| `pnpm e2e`                          | Playwright at 390 / 768 / 1280 / 1920, incl. axe       |
| `pnpm assets:audit`                 | Lists every placeholder and unconfirmed identity field |
| `pnpm assets:generate`              | Regenerates `public/placeholders/` and `public/brand/` |

---

## The five rules that shape this codebase

Everything else follows from these. Each is enforced somewhere, not just
documented.

### 1. No authentication, ever

`web` holds no credential, so it cannot leak one (`CLAUDE.md` §3.7). There is no
login, no account, no token, no cookie session. The browser never calls the
backend: `src/lib/fetcher.ts` is `import "server-only"`, which makes pulling it
into a client component a **build** error rather than a code-review catch.

### 2. Never render a fabricated claim

`CLAUDE.md` §3.5. Stats, client counts, years of practice, office lists, phone
numbers, partner names and the ICAN registration number are **verifiable facts**.
They are typed `T | null` in `src/lib/brand.ts`, ship as `null`, and every
component that consumes them renders _nothing_ when they are absent — no
skeleton, no zero, no "coming soon". A placeholder photograph is honest; a
placeholder statistic is a false claim on a regulated professional's website.

Descriptive copy is a different thing and is populated: the service list, the
sector list, the engagement process and the FAQ live in `src/config/content.ts`
as realistic prose (never lorem), and are meant to be edited rather than deleted.

`src/components/sections/honest-degradation.test.tsx` asserts the absent branch
renders an empty DOM. `/design` renders the _populated_ branch with explicit
sample data, so the styled state stays reviewable.

### 3. No testimonials, client logos or ratings

Regulatory hold under ICAN advertising rules (`CLAUDE.md` §3.5). Not built, not
mounted, not behind a flag. `src/lib/brand.test.ts` also asserts the tagline,
description and intro carry no superlative or comparative claim.

### 3b. Design decisions worth knowing before you change them

Studied against seven Nepali/Indian CA firm sites. What that comparison settled:

- **Serif display, sans body.** Four of five studied sites lead with a serif; the
  one all-sans site reads least premium despite being the most credentialled.
- **No photography on the landing page at all.** The hero is typographic
  (§D.6), and every other section is type and hairlines. Photography is reserved
  for real people, real offices and real cities — none of which exist yet, so
  none is shown. That is also why the placeholder art never appears on `/`.
- **Hairline-ruled grids, not gaps.** `gap-px` over a coloured background draws
  one rule per seam and makes a grid read as cells in a ledger. Used in
  `how-we-work` and the firm-intro commitments.
- **Static figures, never animated counters.** Count-ups read as marketing; a
  ruled row of tabular numerals reads as a schedule.
- **Low CTA density, and the ask varies by intent.** The header offers, the hero
  invites, the closing band asks for the conversation it has just described.
  Repeating one string on every surface turns an invitation into furniture.
- **One featured service.** Six equally-sized cards claim six equally-important
  services; `featured: true` in `config/content.ts` gives the defining one a
  double-width cell. It is data, so the firm can move the emphasis.
- **ICAN registration number _and_ IRD PAN, as a pair, in the footer.** That
  pair is what lets a visitor check the practice against two public registers,
  and it is the cheapest high-value trust asset a Nepali firm has. Both are
  `null` today, so the line renders nothing.
- **Sectors instead of a client list.** Naming the sector plus the specific
  issue it brings communicates more competence than a logo wall, and carries no
  regulatory risk.

### 4. No component names an image path

One registry — `src/lib/assets.ts` — exports typed descriptors
`{ src, width, height, alt, focal, slot, isPlaceholder }`. Every slot has a
locked aspect ratio and declared intrinsic size in `src/lib/image-slots.ts`, so
swapping a placeholder for real art can never shift the layout. `next/image` is
importable only from `src/components/media/` (ESLint `no-restricted-imports`),
and `AssetImage` requires a `sizes` prop as a _type_ constraint.

Real photography lands in the media library, not in git: `photo_asset_id`,
`cover_asset_id` and `image_asset_id` are nullable `media_asset` references and
the placeholder is what renders when they are null. Only the wordmark and the
generated abstract art live in `public/`.

### 5. Never hardcode an internal path

`src/lib/routes.ts` is the typed route registry, and `sitemap.ts` / `robots.ts`
are generated from it — so a page cannot ship un-indexed, and the sitemap can
never advertise a URL that robots.txt disallows.

---

## Layout

```
src/
├── app/
│   ├── layout.tsx            fonts · metadataBase · Organization/WebSite JSON-LD
│   ├── globals.css           VERBATIM copy of ../shared/globals.css — do not edit
│   ├── site.css              public-site-only decoration (see below)
│   ├── (marketing)/          chrome + landing page
│   ├── (legal)/              privacy · terms · disclaimer, narrow prose layout
│   ├── design/               the living design system + framable preview
│   ├── api/revalidate/       secret-guarded, allowlisted publish webhook
│   └── sitemap.ts robots.ts error.tsx global-error.tsx not-found.tsx loading.tsx
├── components/
│   ├── ui/                   owned primitives on @base-ui/react
│   ├── layout/               container · section · header · mobile-nav · footer · action bar
│   ├── media/                the one place next/image is imported
│   ├── sections/             page-composition units — a page is a list of these
│   ├── seo/                  JSON-LD renderer
│   └── brand/                inline wordmark + monogram (currentColor)
├── config/                   nav · editorial content awaiting the CMS
├── features/settings/        types → api → service, the three-layer data pattern
└── lib/                      brand · routes · assets · fetcher · seo · format · …
```

**Pages are shells.** `app/(marketing)/page.tsx` is a list of `<Section/>` and
nothing else; all substance lives in `components/sections/`.

`components/layout/section.tsx` is the section primitive: it owns the ground, the
vertical rhythm and the `aria-labelledby` region, so the page's light/muted
alternation is one prop per section rather than a padding string repeated eleven
times. The alternation is chosen at the call site in `page.tsx`, because several
sections render nothing while the firm's facts are unconfirmed — the rhythm has
to be right for what actually renders.

### `globals.css` is copied, not authored

`src/app/globals.css` is a **verbatim** copy of `../shared/globals.css`, the
canonical design system shared with `admin` (`ARCHITECTURE.md` §J.2). Edit it
_there_ and re-copy; CI fails if the two diverge. Public-site-only decoration —
the hero ground, the ledger-rule motif, the credential marquee, the scroll
entrance — lives in `src/app/site.css` so that rule holds.

---

## Data

Three layers, per `ARCHITECTURE.md` §D.4:

- `features/<f>/api.ts` — one function per endpoint, native `fetch` with
  `next: { revalidate, tags }`. **Axios is banned** (ESLint enforces it): it is
  invisible to Next's cache and forces coarse whole-page ISR.
- `features/<f>/service.ts` — orchestration, wire→domain mapping, and error
  _policy_. Never throws for optional content. Keeps three outcomes distinct:
  genuine 404 → `notFound()`; outage → error boundary; empty-but-valid → nothing.
- Components receive domain objects. **No mock or seed fallback layer** — a
  fallback hides real failures (`ARCHITECTURE.md` §O.18).

### Cache invalidation

The backend POSTs `{type, slug}` to `/api/revalidate` with an
`x-revalidate-secret` header. **This app owns the entity→tag mapping**
(`src/lib/revalidation-tags.ts`), not the backend — so a leaked secret buys an
attacker "re-render one of seven known content types", not "re-render anything".
The same map is read at the fetch site, which is what stops the classic
published-content-never-appears bug.

---

## Mobile-first

Authored at base width; `md:`/`lg:` add complexity. A `lg:`-first component with
`max-lg:` overrides is a bug (`ARCHITECTURE.md` §D.3).

- Fluid `clamp()` type scale in `rem` — headings scale continuously.
- `pointer-coarse:min-h-11` touch floors on every control, coarse pointers only.
- Container queries (`cq-sm`/`cq-md`/`cq-lg`) so a card is correct in a narrow
  column on a wide screen.
- Header: wordmark + hamburger below `lg`, full nav from `lg`.
- Footer: accordion on phone, four columns from `md`.
- **Fixed Call · WhatsApp · Book bar below `md` only**, with
  `env(safe-area-inset-bottom)` and a matching `<main>` padding built from the
  same `--action-bar-h` token, so it can never occlude content.
- Verified, not assumed: `pnpm e2e` asserts no horizontal overflow and zero
  serious/critical axe violations at 390 / 768 / 1280 / 1920.

`/design` renders the live site in an iframe at those same four widths, so the
review surface and the CI gate agree by construction.

---

## Security notes

- **`images.formats` is `["image/webp"]` and must never include `"image/avif"`.**
  GHSA-2xp9-vwfh-vxw4 (August 2026, critical) is an unauthenticated RCE in the
  Image Optimization API reached through an attacker-controlled AVIF image; the
  fix was to _disable_ AVIF. `ecommerce_fe` enables it — that half of the
  reference pattern is deliberately not carried across (`CLAUDE.md` §4.1).
- Pinned exactly: `next@16.3.4`, `react@19.2.8`, `react-dom@19.2.8`.
  `pnpm audit --audit-level=high` runs in CI.
- CSP is assembled from a directive map in `next.config.ts`, plus HSTS,
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and
  `Permissions-Policy`. The single exception is `/design/preview`, which carries
  `SAMEORIGIN` / `frame-ancestors 'self'` so the viewport switcher can frame it;
  every other route, `/` included, keeps `DENY`.
- `/uploads/:path*` is rewritten to the backend so CMS media is same-origin: the
  CSP stays `img-src 'self'`, `next/image` needs no `remotePatterns`, and the API
  origin never appears in HTML.
- `dangerouslyAllowSVG` is off; SVG assets bypass the optimizer via `unoptimized`.

---

## Not supported by the backend yet

Documented negative space (`CLAUDE.md` §5.2) — do not build UI for these until
the endpoint exists:

| Surface                                    | Status                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `GET /public/articles`, `/articles/{slug}` | ⬜ Phase 2. `InsightRail` is built and takes a prop; `/` passes `[]`.                                                 |
| `GET /public/site-messages?path=`          | ⬜ Phase 3. No announcement bar, banner or popup is mounted.                                                          |
| Media library (`/admin/media`)             | ⬜ Phase 1b. `assetOrPlaceholder()` is ready for it.                                                                  |
| Contact form submission                    | No endpoint yet. `/contact` is a registered route with no page.                                                       |
| Compliance-deadline widget (§D.6 row 12)   | Needs a Bikram Sambat calendar and a statutory deadline table. Shipping a wrong deadline is worse than shipping none. |
| Dynamic `opengraph-image`                  | The `og-image` slot is specified; social scrapers reject SVG, so a real PNG route is Phase 2.                         |

Also deliberately absent: testimonials, client logos, ratings (regulatory hold),
and any authentication.

---

## Before launch

`pnpm assets:audit` prints the handover checklist — every generated placeholder
and every identity field still awaiting the firm. It exits non-zero while
anything is outstanding, so it can become a release gate without being rewritten.
It is **not** in the CI chain today: everything is a placeholder by design at this
stage, and a gate that always fails is a gate people learn to ignore.

The firm name is settled — **Rahul & Associates, Chartered Accountants**. What
is still outstanding is the rest of the identity: ICAN registration number, year
established, offices, phone, WhatsApp, email, partners and any statistic. Those
are the fields the audit lists, and every one of them renders nothing until it
is filled in.
