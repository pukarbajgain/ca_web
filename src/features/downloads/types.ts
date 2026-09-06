/**
 * Wire types for `/api/v1/public/downloads` (API_CONTRACT.md §6:
 * "Exposes `file_url`, `file_size_bytes`, `file_mime_type`. `?category=`").
 *
 * Mirrored 1:1 in snake_case, same discipline as `features/insights/types.ts`.
 * No `id`/`public_id`/`*_id` — a download is addressed by slug, and `file_url`
 * is the only place its bytes are referenced; per the admin contract a document
 * is never handed out as a raw storage URL, only through a served download
 * route, so this string is safe to link directly.
 */

/**
 * The category enum the backend's `downloads` resource actually uses.
 * Anything the wire sends outside this list is a contract drift, not a value
 * this app should silently accept — see `toCategory` in `service.ts`.
 */
export const DOWNLOAD_CATEGORIES = [
  "circular",
  "form",
  "notice",
  "act_or_rule",
  "guide",
  "other",
] as const;

export type DownloadCategoryWire = (typeof DOWNLOAD_CATEGORIES)[number];

export type DownloadWire = {
  slug: string;
  title: string;
  description: string | null;
  category: DownloadCategoryWire;
  file_url: string;
  file_size_bytes: number;
  file_mime_type: string;
};
