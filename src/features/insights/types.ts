/**
 * Wire types for `/api/v1/public/articles`, mirrored 1:1 in snake_case so a
 * field is greppable across both repositories (CLAUDE.md §5.1).
 *
 * Two contract details worth knowing before using these:
 *
 * - **No `id`, no `public_id`, no `*_id`.** Public payloads address content by
 *   slug. A contract test on the backend enforces it, so a stray identifier
 *   here would be a bug on that side, not a field to map.
 * - **The reader-facing "Updated" date is `modified_at`, not `updated_at`.**
 *   The name differs deliberately: `updated_at` is on the leakage test's
 *   forbidden list, and renaming kept that rule intact rather than punching a
 *   hole in it for one field the page genuinely needs to show.
 */

export type AssetWire = {
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  focal_x: number | null;
  focal_y: number | null;
  renditions: Record<string, string> | null;
};

export type BylineWire = {
  name: string;
  slug: string;
  post_nominals: string | null;
  designation: string | null;
  photo: AssetWire | null;
};

export type TaxonomyRefWire = { name: string; slug: string };

export type ArticleSummaryWire = {
  title: string;
  slug: string;
  standfirst: string | null;
  published_at: string | null;
  modified_at: string;
  reading_minutes: number | null;
  is_featured: boolean;
  category: TaxonomyRefWire | null;
  tags: TaxonomyRefWire[];
  author: BylineWire | null;
  cover: AssetWire | null;
};

export type ArticleDetailWire = ArticleSummaryWire & {
  body_html: string;
  disclaimer: string | null;
  reviewer: BylineWire | null;
  faqs: { question: string; answer: string }[];
  related_services: TaxonomyRefWire[];
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  og_image: AssetWire | null;
};
