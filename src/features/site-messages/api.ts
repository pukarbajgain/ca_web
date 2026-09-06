import "server-only";

import { apiGetOptional } from "@/lib/fetcher";
import type { OptionalRead } from "@/lib/fetcher";
import { COLLECTION_TAGS } from "@/lib/revalidation-tags";

import type { SiteMessagesWire } from "./types";

/**
 * Site messages refresh faster than the rest of the site, on purpose.
 *
 * The site-wide ISR floor is 300s (`DEFAULT_REVALIDATE_SECONDS`), and for an
 * article that is exactly right — nobody is harmed by a five-minute-old essay.
 * A message is the one thing here with minute-level meaning: "the office is
 * closed on Friday" stops being true at a moment somebody chose.
 *
 * *Appearance* is already instant — publishing invalidates the `site-messages`
 * tag through the webhook, so a new notice is live on the next request.
 * **Expiry is the case a tag cannot cover**: a message ends by the clock passing
 * its `ends_at`, with no row mutation and therefore no webhook (that is the
 * point of read-time visibility resolution — ARCHITECTURE.md §C.3). Only a TTL
 * can catch it, so the TTL is the resolution at which a lapsed notice may
 * linger. One minute is the number this firm can live with; five was not.
 */
export const SITE_MESSAGE_REVALIDATE_SECONDS = 60;

/**
 * The messages live on one path.
 *
 * `path` is required by the backend rather than defaulted, deliberately: a
 * caller that forgot it would otherwise render the home page's messages on
 * every page, which is a bug nobody would report.
 */
export function fetchSiteMessages(path: string): Promise<OptionalRead<SiteMessagesWire>> {
  return apiGetOptional<SiteMessagesWire>("/public/site-messages", {
    searchParams: { path },
    revalidate: SITE_MESSAGE_REVALIDATE_SECONDS,
    tags: [COLLECTION_TAGS.site_message],
  });
}
