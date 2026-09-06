/**
 * Wire types for `/api/v1/public/team` (API_CONTRACT.md §6 — public team
 * directory). `GET /team` and `GET /team/{slug}` share this shape exactly.
 *
 * Mirrored 1:1 in snake_case, same discipline as `features/insights/types.ts`:
 *
 * - **No `id`, no `public_id`, no `*_id`.** Public payloads address content by
 *   slug — the leakage contract test on the backend enforces it.
 * - `photo` is the same asset projection `/public/articles` uses for `cover`:
 *   `{url, alt_text, width, height, focal_x, focal_y, renditions}` or `null`.
 * - `office`, like an article's `category`/`tags`, is a compact `{name, slug}`
 *   reference rather than the full structured address `/public/offices`
 *   exposes — a team profile names *which* office, it does not repeat the
 *   office's own page.
 * - `practice_areas` is a plain string list, not `{name, slug}` pairs: these
 *   are not a browsable taxonomy with their own pages, and `lib/seo.ts`'s
 *   `personJsonLd()` wants exactly `readonly string[]` for `knowsAbout`.
 */

export type TeamPhotoWire = {
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  focal_x: number | null;
  focal_y: number | null;
  renditions: Record<string, string> | null;
};

export type TeamOfficeRefWire = { name: string; slug: string };

export type TeamMemberWire = {
  name: string;
  slug: string;
  post_nominals: string | null;
  designation: string | null;
  photo: TeamPhotoWire | null;
  practice_areas: string[];
  office: TeamOfficeRefWire | null;
  bio: string | null;
};
