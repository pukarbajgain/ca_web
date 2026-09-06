import "server-only";

import { apiGetOptional, DEFAULT_REVALIDATE_SECONDS } from "@/lib/fetcher";
import type { OptionalRead } from "@/lib/fetcher";
import { COLLECTION_TAGS } from "@/lib/revalidation-tags";

import type { SiteSettingsWire } from "./types";

/**
 * One function per endpoint. No UI concerns, no error policy — that is
 * `service.ts`'s job (ARCHITECTURE.md §D.4).
 *
 * The `settings` tag matches `COLLECTION_TAGS.settings`, which is what
 * `/api/revalidate` invalidates when the backend reports a settings change.
 * Reading the tag from the shared map rather than typing the string is the
 * whole reason publishing-doesn't-appear bugs stay rare.
 */
export function fetchSiteSettings(): Promise<OptionalRead<SiteSettingsWire>> {
  return apiGetOptional<SiteSettingsWire>("/public/settings", {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [COLLECTION_TAGS.settings],
  });
}
