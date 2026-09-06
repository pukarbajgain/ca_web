import { cache } from "react";

import { services as editorialServices } from "@/config/content";

import type { Service, ServiceSummary } from "./types";

/**
 * `service.ts` — **the only place the site reads service content.**
 *
 * ── Where the data comes from, and why that is not a mock ──────────────────
 * These functions read `src/config/content.ts`: typed, hand-authored editorial
 * content, checked into the repository and rendered directly.
 *
 * That is **not** a mock/seed fallback layer, which ARCHITECTURE.md §O.18 bans.
 * A fallback is a second code path that fabricates data when the first one
 * fails, and it is banned because it hides real failures. There is no first path
 * here to fail. This is the firm's actual copy.
 *
 * ── This is now permanent, not a placeholder ────────────────────────────────
 * An earlier version of this comment described the arrangement as temporary and
 * sketched the fetch that would replace it. **CLAUDE.md §3.3c settled it the
 * other way on 6 September 2026:** the console manages articles, site messages
 * and downloads, and *"everything else on the website is static, hardcoded
 * content — services, questions (FAQs), offices/contact details, and standalone
 * pages"*. The admin modules for those were built and then removed.
 *
 * `GET /api/v1/public/services` does still exist on the backend — the article
 * editor's related-services picker reads the admin side of the same data — but
 * this page deliberately does not call it. A firm rewrites its service
 * descriptions every few years; a screen nobody opens is a screen that still
 * has to be learned, tested and maintained.
 *
 * ── The rule that would apply if this ever did become a fetch ──────────────
 * Kept because it is the trap, and because `insights` and `downloads` next door
 * are fetches and must obey it: `listServices()` would have to **throw** on an
 * outage so the route's error boundary renders, and return `[]` only when the
 * practice has genuinely published nothing. CLAUDE.md §3.8c: *a failed fetch
 * must never render as a confident empty state* — "no services" on a chartered accountancy
 * firm's services page because a request timed out is not an empty state, it is
 * a misrepresentation of the firm. `apiGetOptional` (which swallows a failure and
 * returns `null`) is therefore the **wrong** helper here; it is right for
 * optional site chrome and wrong for the substance of a page. Use `apiGet`, and
 * let the throw travel.
 *
 * ── Why `cache()` ──────────────────────────────────────────────────────────
 * `generateMetadata` and the page body both load the same service. Without
 * `cache()` that is two reads today and two HTTP requests after the swap, and —
 * more importantly — two chances for them to disagree about whether the slug
 * exists. Deduping is what lets `notFound()` be called from inside
 * `generateMetadata`, which is the difference between a real 404 and a soft one
 * (ARCHITECTURE.md §D.5).
 */

/** Present the authored record as the domain shape the pages consume. */
function toService(item: (typeof editorialServices)[number]): Service {
  return {
    slug: item.slug,
    name: item.name,
    summary: item.summary,
    icon: item.icon,
    metaDescription: item.metaDescription,
    overview: item.overview,
    whatsIncluded: item.whatsIncluded,
    whoFor: item.whoFor,
    whatYouGet: item.whatYouGet,
    faqs: item.faqs,
  };
}

/**
 * Every published practice area, in display order.
 *
 * `async` although nothing awaits: the signature is the contract, and a
 * synchronous version would have to become async — at every call site — the day
 * the fetch lands.
 */
export const listServices = cache(async (): Promise<readonly Service[]> =>
  editorialServices.map(toService),
);

/**
 * One service, or `null` when the slug is unknown.
 *
 * **Returns `null` rather than calling `notFound()`.** The loader states a fact;
 * the page decides the policy. That separation is what allows `generateMetadata`
 * to be the thing that calls `notFound()` — a loader that redirected on its own
 * would 404 the metadata pass and the render pass independently, and would be
 * unusable from anywhere that legitimately tolerates a miss.
 */
export const getService = cache(async (slug: string): Promise<Service | null> => {
  const all = await listServices();
  return all.find((service) => service.slug === slug) ?? null;
});

/** Slugs for `generateStaticParams` and for the sitemap. */
export async function listServiceSlugs(): Promise<readonly string[]> {
  const all = await listServices();
  return all.map((service) => service.slug);
}

/**
 * The cross-link rail at the foot of a detail page: every *other* service.
 *
 * Excluding the current one is the whole point — a "See also" list that includes
 * the page you are already on is a dead link dressed as a suggestion.
 */
export async function listOtherServices(
  slug: string,
  limit = 5,
): Promise<readonly ServiceSummary[]> {
  const all = await listServices();
  return all
    .filter((service) => service.slug !== slug)
    .slice(0, limit)
    .map(({ slug: s, name, summary, icon }) => ({ slug: s, name, summary, icon }));
}

/**
 * `{slug, name}` pairs for the contact form's "Service needed" select.
 *
 * Returned from a Server Component and passed to the client form as props, so
 * the browser receives six short strings rather than the whole content module.
 */
export async function listServiceOptions(): Promise<
  readonly { slug: string; name: string }[]
> {
  const all = await listServices();
  return all.map(({ slug, name }) => ({ slug, name }));
}
