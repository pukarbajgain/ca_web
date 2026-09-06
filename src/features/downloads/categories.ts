import { DOWNLOAD_CATEGORIES } from "./types";

import type { DownloadCategory } from "./service";

/**
 * Reader-facing labels for the download category enum (CLAUDE.md §5.2: a raw
 * enum value must never reach the UI — `act_or_rule` is a database value,
 * "Acts and rules" is a label).
 *
 * **Display order**, not alphabetical: circulars and notices are what a client
 * checks most often, forms are what they come here to fetch, acts/rules and
 * guides are reference material, and "Other" is always last regardless of how
 * few items it holds.
 */
export const DOWNLOAD_CATEGORY_ORDER: readonly DownloadCategory[] = [
  "circular",
  "notice",
  "form",
  "act_or_rule",
  "guide",
  "other",
];

export const DOWNLOAD_CATEGORY_LABELS: Record<DownloadCategory, string> = {
  circular: "Circulars",
  notice: "Notices",
  form: "Forms",
  act_or_rule: "Acts and rules",
  guide: "Guides",
  other: "Other",
};

// A category present in the wire enum but missing an order/label entry would
// silently vanish from the grouped view rather than fail loudly — this is the
// gate on that, exercised in `categories.test.ts`.
export function assertEveryCategoryIsLabelled(): void {
  for (const category of DOWNLOAD_CATEGORIES) {
    if (!DOWNLOAD_CATEGORY_ORDER.includes(category)) {
      throw new Error(
        `Download category "${category}" is missing from DOWNLOAD_CATEGORY_ORDER`,
      );
    }
    if (!DOWNLOAD_CATEGORY_LABELS[category]) {
      throw new Error(`Download category "${category}" is missing a reader-facing label`);
    }
  }
}
