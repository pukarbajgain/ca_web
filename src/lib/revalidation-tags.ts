/**
 * The entity → cache-tag mapping. **This app owns it, not the backend.**
 *
 * ARCHITECTURE.md §P.3 makes the reason explicit: the backend sends a semantic
 * event (`{type, slug}`), and `web` translates it into the tags *it* happens to
 * have used. If the backend sent paths or tags instead, every routing change
 * here would need a coordinated backend deploy, and a leaked webhook secret
 * would become "re-render anything on demand" rather than "re-render one of
 * eight known things".
 *
 * Adding a content type means adding a case here *and* using the same tag in the
 * fetch that loads it. A test asserts that every declared type produces a
 * non-empty, allowlisted tag set.
 */

/** Content types the backend may announce. Anything else is rejected with 400. */
export const REVALIDATABLE_TYPES = [
  "settings",
  "article",
  "service",
  "team_member",
  "office",
  "faq",
  "site_message",
  "download",
] as const;

export type RevalidatableType = (typeof REVALIDATABLE_TYPES)[number];

export function isRevalidatableType(value: unknown): value is RevalidatableType {
  return (
    typeof value === "string" &&
    (REVALIDATABLE_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Collection-level tags. Every list fetch carries one of these, so a publish
 * refreshes the listings without touching unrelated pages.
 */
export const COLLECTION_TAGS = {
  settings: "settings",
  article: "articles",
  service: "services",
  team_member: "team",
  office: "offices",
  faq: "faqs",
  site_message: "site-messages",
  download: "downloads",
} as const satisfies Record<RevalidatableType, string>;

/** Slug pattern the backend may send. Deliberately strict: a tag is a cache key,
 *  and an unbounded string is an unbounded key space. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && SLUG_PATTERN.test(value);
}

/**
 * Tags to invalidate for one event.
 *
 * Always includes the collection tag (the listing changed) and, when a valid
 * slug is present, the item tag (that one page changed). An invalid slug is
 * dropped rather than rejected: the listing still needs refreshing, and
 * refusing the whole request would leave the site stale over a formatting nit.
 */
export function tagsForEvent(type: RevalidatableType, slug?: unknown): string[] {
  const tags: string[] = [COLLECTION_TAGS[type]];
  if (type !== "settings" && isValidSlug(slug)) tags.push(`${type}:${slug}`);
  return tags;
}

/** Tag for a single item, used at the fetch site so the two always agree. */
export function itemTag(
  type: Exclude<RevalidatableType, "settings">,
  slug: string,
): string {
  return `${type}:${slug}`;
}
