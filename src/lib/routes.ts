/**
 * `routes.ts` — the typed route registry.
 *
 * **Never hardcode an internal path anywhere** (CLAUDE.md §5.1). Every `href`
 * in the app resolves through here, which buys three concrete things:
 *
 *  1. A rename is one edit. Slug changes on a CA firm's site are a ranking
 *     event (§P.3), so they must be cheap enough to do properly.
 *  2. `sitemap.ts` is generated from this object rather than hand-maintained,
 *     so a page cannot ship un-indexed because someone forgot the sitemap.
 *  3. `indexable: false` is declared next to the route it describes, not in a
 *     separate list that drifts.
 *
 * Functions, not string constants, even for static paths: it keeps the call
 * sites uniform (`routes.services()` / `routes.service(slug)`) so a static
 * route can gain a parameter later without touching every consumer.
 */

import { services } from "@/config/content";

/** Routes that exist today. Phase-2+ routes are added when the backend does. */
export const routes = {
  home: () => "/",
  about: () => "/about",
  services: () => "/services",
  service: (slug: string) => `/services/${slug}`,
  team: () => "/team",
  person: (slug: string) => `/team/${slug}`,
  insights: () => "/insights",
  article: (slug: string) => `/insights/${slug}`,
  downloads: () => "/downloads",
  contact: () => "/contact",
  offices: () => "/#offices",
  faq: () => "/#faq",

  // (legal) route group — narrow prose layout.
  privacy: () => "/privacy",
  terms: () => "/terms",
  disclaimer: () => "/disclaimer",

  // Non-page surfaces. Present here so nothing else builds these strings.
  design: () => "/design",
  /** The framable landing-page preview the /design viewport switcher loads. */
  designPreview: () => "/design/preview",
  sitemap: () => "/sitemap.xml",
  robots: () => "/robots.txt",
  revalidate: () => "/api/revalidate",
  /** The enquiry form's own route handler. First-party and same-origin — the
   *  browser never posts to the backend directly (ARCHITECTURE.md §C.2). */
  contactApi: () => "/api/contact",
} as const;

export type RouteKey = keyof typeof routes;

/**
 * Sitemap metadata for the static routes.
 *
 * `changeFrequency`/`priority` are hints crawlers largely ignore, but the
 * `indexable` flag is load-bearing: it is read by both `sitemap.ts` and
 * `robots.ts`, so a route can never appear in the sitemap while being
 * disallowed in robots.txt — a contradiction that costs crawl budget.
 */
export type StaticRouteMeta = {
  readonly path: string;
  readonly indexable: boolean;
  readonly changeFrequency:
    "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  readonly priority: number;
};

export const staticRoutes: readonly StaticRouteMeta[] = [
  { path: routes.home(), indexable: true, changeFrequency: "weekly", priority: 1.0 },
  { path: routes.about(), indexable: true, changeFrequency: "monthly", priority: 0.8 },
  { path: routes.services(), indexable: true, changeFrequency: "monthly", priority: 0.9 },
  { path: routes.team(), indexable: true, changeFrequency: "monthly", priority: 0.8 },
  { path: routes.insights(), indexable: true, changeFrequency: "weekly", priority: 0.8 },
  {
    path: routes.downloads(),
    indexable: true,
    changeFrequency: "monthly",
    priority: 0.5,
  },
  { path: routes.contact(), indexable: true, changeFrequency: "yearly", priority: 0.7 },
  { path: routes.privacy(), indexable: true, changeFrequency: "yearly", priority: 0.2 },
  { path: routes.terms(), indexable: true, changeFrequency: "yearly", priority: 0.2 },
  {
    path: routes.disclaimer(),
    indexable: true,
    changeFrequency: "yearly",
    priority: 0.2,
  },

  /* ── Service detail pages ────────────────────────────────────────────────
   * `/services/[slug]` is prerendered by `generateStaticParams`, so these are
   * static routes in the only sense that matters to a crawler: every one of
   * them is a real, indexable URL at build time.
   *
   * Listing them here rather than editing `sitemap.ts` is deliberate — the
   * sitemap is generated *from this registry* precisely so that a page cannot
   * ship un-indexed because someone forgot a second file. Spreading them keeps
   * that property with no change to `sitemap.ts` at all.
   *
   * **This is the one place other than `features/services/service.ts` that
   * reads the service list.** When `GET /api/v1/public/services` lands, both
   * move together: `sitemap.ts` becomes `async` and calls `listServiceSlugs()`,
   * and this spread is deleted. That is the two-call-site cost of keeping a
   * synchronous route registry, and it is recorded in both files so neither can
   * be changed without the other being found.
   *
   * Priority 0.8: below the index (0.9), above the legal pages. These are the
   * pages the practice most wants found after the homepage. */
  ...services.map((service) => ({
    path: routes.service(service.slug),
    indexable: true,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
  /* The design system is an internal review surface. It is deliberately served
   * (not gated) so it can be linked to stakeholders, but it is not content and
   * must never compete with a real page in search results. Its preview route is
   * a literal duplicate of `/`, which makes keeping it out of the index a
   * duplicate-content requirement rather than merely tidy. */
  { path: routes.design(), indexable: false, changeFrequency: "never", priority: 0.0 },
  {
    path: routes.designPreview(),
    indexable: false,
    changeFrequency: "never",
    priority: 0.0,
  },
];

/** Paths `robots.txt` disallows: the non-indexable routes plus the API surface. */
export const disallowedPaths: readonly string[] = [
  ...staticRoutes.filter((r) => !r.indexable).map((r) => r.path),
  "/api/",
];

/** True for hrefs that leave the site, so the caller can add rel/target safely. */
export function isExternalHref(href: string): boolean {
  return (
    /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")
  );
}
