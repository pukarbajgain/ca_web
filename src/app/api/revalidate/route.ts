import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import {
  isRevalidatableType,
  tagsForEvent,
  REVALIDATABLE_TYPES,
} from "@/lib/revalidation-tags";

/**
 * Publish webhook: the backend calls this after a content change so the site
 * refreshes now rather than waiting out the 300s ISR window.
 *
 * ── The three properties that matter ────────────────────────────────────────
 *
 * 1. **Secret-guarded, fail-closed, constant-time.** The comparison uses
 *    `timingSafeEqual` because a naive `===` on a secret leaks its prefix to an
 *    attacker who can measure response time — cheap to avoid, and this endpoint
 *    is public by necessity. The header carries the secret rather than a query
 *    parameter, so it does not land in access logs or a Referer.
 *
 * 2. **Semantic input, allow-listed.** The backend sends `{type, slug}` — an
 *    *event*, not a path — and this app owns the entity→tag mapping
 *    (`lib/revalidation-tags.ts`). A free-form `path` or `tag` parameter would
 *    turn a leaked secret into "re-render anything on demand"; here the worst
 *    an attacker achieves is re-rendering one of seven known content types,
 *    which costs a little CPU and reveals nothing.
 *
 * 3. **Tags, not paths.** `revalidatePath("/")` invalidates a whole page tree.
 *    Tags invalidate exactly the fetches that declared them, so publishing one
 *    article does not re-render the services page (ARCHITECTURE.md §O.2).
 *
 * Runtime is Node because `timingSafeEqual` comes from `node:crypto`.
 */
export const runtime = "nodejs";

type RevalidateBody = { type?: unknown; slug?: unknown };

/** Constant-time comparison that also tolerates a length mismatch. */
function secretMatches(presented: string | null): boolean {
  if (!presented) return false;
  const expected = Buffer.from(env.REVALIDATE_SECRET, "utf8");
  const actual = Buffer.from(presented, "utf8");
  // `timingSafeEqual` throws on unequal lengths, which would itself be a timing
  // signal; comparing the digest-length-normalised buffers avoids the branch.
  if (expected.length !== actual.length) {
    // Still burn a comparison so the failure path costs the same either way.
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    // No detail. An unauthenticated caller learns nothing about the endpoint.
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json(
      { revalidated: false, error: "expected a JSON body" },
      { status: 400 },
    );
  }

  if (!isRevalidatableType(body.type)) {
    // Naming the accepted types is safe (they are in the public contract) and
    // saves a round of debugging when the backend adds a content type.
    return NextResponse.json(
      {
        revalidated: false,
        error: "unknown type",
        accepted: REVALIDATABLE_TYPES,
      },
      { status: 400 },
    );
  }

  const tags = tagsForEvent(body.type, body.slug);
  /* Next 16 requires an explicit cacheLife profile. `{ expire: 0 }` means "this
   * tag's cached entries are stale as of now" — which is exactly a publish
   * event, and is the closest equivalent to Next 15's single-argument form.
   * `updateTag` would be stronger (read-your-own-writes) but is Server-Action
   * only, and this is a webhook. */
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: true, tags });
}
