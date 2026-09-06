import Link from "next/link";

import { routes } from "@/lib/routes";

/**
 * Not-found boundary for `/insights` and `/insights/[slug]`.
 *
 * **This file exists because the root `not-found.tsx` was not enough.** A
 * `notFound()` thrown from this dynamic route rendered an empty body rather than
 * the site-wide 404 page, so the segment needs its own boundary.
 *
 * The *status* was a second, separate bug with the same symptom: a root
 * `app/loading.tsx` commits a `200` the moment it streams, so every `notFound()`
 * on a dynamic route shipped a **soft 404** — a page search engines index as
 * real. Measured: `/insights/does-not-exist` returned `200` with the root
 * `loading.tsx` present and `404` without it, while `/totally-missing` (Next's
 * own routing, no page to stream) returned `404` throughout. The root
 * `loading.tsx` was therefore removed — it was shape-matched to the landing page
 * yet applied to every route, so it was also flashing a landing-page skeleton on
 * `/contact` and `/services`.
 *
 * **If a loading state is wanted later, scope it to a segment that cannot 404.**
 *
 * A segment-level boundary also gives a better answer than the site-wide one:
 * somebody who followed a stale link to an article wants the other articles,
 * not the home page.
 */
export default function InsightNotFound() {
  return (
    <div className="mx-auto max-w-page px-6 py-24 md:px-10 md:py-32">
      <p className="text-label-medium text-tertiary uppercase">Not found</p>
      <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
        We could not find that article.
      </h1>
      <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
        It may have been renamed or withdrawn. Everything we have published is listed on
        the insights page.
      </p>
      <Link
        href={routes.insights()}
        className="mt-8 inline-block text-primary hover:underline"
      >
        ← All insights
      </Link>
    </div>
  );
}
