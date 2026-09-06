import Link from "next/link";

import { routes } from "@/lib/routes";

/**
 * Not-found boundary for `/team` and `/team/[slug]`.
 *
 * Exists for the same reason `insights/not-found.tsx` does: a `notFound()`
 * thrown from `team/[slug]/page.tsx` needs a segment-level boundary, or it
 * renders an empty body instead of a real 404 page. See that file's comment for
 * the measured root cause (a root `app/loading.tsx` — since removed — committing
 * a `200` before `notFound()` could run) and why the fix is scoped to the
 * segment rather than restored globally.
 *
 * A segment-level boundary also gives a better answer than the site-wide one:
 * someone who followed a stale link to a person wants the rest of the team, not
 * the home page.
 */
export default function TeamNotFound() {
  return (
    <div className="mx-auto max-w-page px-6 py-24 md:px-10 md:py-32">
      <p className="text-label-medium text-tertiary uppercase">Not found</p>
      <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
        We could not find that profile.
      </h1>
      <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
        They may no longer be with the practice, or the link may be out of date. Everyone
        currently on the team is listed on the team page.
      </p>
      <Link
        href={routes.team()}
        className="mt-8 inline-block text-primary hover:underline"
      >
        ← Our team
      </Link>
    </div>
  );
}
