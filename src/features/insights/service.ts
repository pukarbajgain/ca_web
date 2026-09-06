import "server-only";
import { cache } from "react";

import { apiGet, ApiError, type Page } from "@/lib/fetcher";
import { COLLECTION_TAGS, itemTag } from "@/lib/revalidation-tags";

import type {
  ArticleDetailWire,
  ArticleSummaryWire,
  AssetWire,
  BylineWire,
} from "./types";

/** Domain shapes. camelCase, and only what a page actually renders. */
export type Asset = {
  readonly url: string;
  readonly alt: string;
  readonly width: number | null;
  readonly height: number | null;
};

export type Byline = {
  readonly name: string;
  readonly slug: string;
  readonly postNominals: string | null;
  readonly designation: string | null;
};

export type ArticleSummary = {
  readonly title: string;
  readonly slug: string;
  readonly standfirst: string | null;
  readonly publishedAt: string | null;
  readonly modifiedAt: string;
  readonly readingMinutes: number | null;
  readonly isFeatured: boolean;
  readonly category: { readonly name: string; readonly slug: string } | null;
  readonly tags: readonly { readonly name: string; readonly slug: string }[];
  readonly author: Byline | null;
  readonly cover: Asset | null;
};

export type ArticleDetail = ArticleSummary & {
  readonly bodyHtml: string;
  readonly disclaimer: string | null;
  readonly reviewer: Byline | null;
  readonly faqs: readonly { readonly question: string; readonly answer: string }[];
  readonly relatedServices: readonly { readonly name: string; readonly slug: string }[];
  readonly metaTitle: string | null;
  readonly metaDescription: string | null;
  readonly canonicalUrl: string | null;
  readonly noindex: boolean;
};

export type ArticleListRead =
  | {
      readonly status: "ok";
      readonly items: readonly ArticleSummary[];
      readonly total: number;
      readonly page: number;
      readonly pageSize: number;
    }
  | { readonly status: "unavailable"; readonly reference: string | null };

export type ArticleRead =
  | { readonly status: "ok"; readonly article: ArticleDetail }
  | { readonly status: "absent" }
  | { readonly status: "unavailable"; readonly reference: string | null };

const toAsset = (wire: AssetWire | null): Asset | null =>
  wire
    ? { url: wire.url, alt: wire.alt_text ?? "", width: wire.width, height: wire.height }
    : null;

const toByline = (wire: BylineWire | null): Byline | null =>
  wire
    ? {
        name: wire.name,
        slug: wire.slug,
        postNominals: wire.post_nominals,
        designation: wire.designation,
      }
    : null;

function toSummary(wire: ArticleSummaryWire): ArticleSummary {
  return {
    title: wire.title,
    slug: wire.slug,
    standfirst: wire.standfirst,
    publishedAt: wire.published_at,
    modifiedAt: wire.modified_at,
    readingMinutes: wire.reading_minutes,
    isFeatured: wire.is_featured,
    category: wire.category,
    tags: wire.tags,
    author: toByline(wire.author),
    cover: toAsset(wire.cover),
  };
}

export type ArticleQuery = {
  readonly category?: string | undefined;
  readonly tag?: string | undefined;
  readonly q?: string | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
};

/**
 * The insights index.
 *
 * **Never throws.** An outage returns `unavailable` with the request reference,
 * so the page can say "we could not load these just now" instead of rendering
 * an empty list — "no articles yet" when the API is down is a lie, and the one
 * failure mode this page must not have (CLAUDE.md §3.8c).
 */
export async function getArticles(query: ArticleQuery = {}): Promise<ArticleListRead> {
  const searchParams: Record<string, string> = {};
  if (query.category) searchParams.category = query.category;
  if (query.tag) searchParams.tag = query.tag;
  if (query.q) searchParams.q = query.q;
  if (query.page && query.page > 1) searchParams.page = String(query.page);
  if (query.pageSize) searchParams.page_size = String(query.pageSize);

  try {
    const page = await apiGet<Page<ArticleSummaryWire>>("/public/articles", {
      searchParams,
      tags: [COLLECTION_TAGS.article],
    });
    return {
      status: "ok",
      items: page.items.map(toSummary),
      total: page.total,
      page: page.page,
      pageSize: page.page_size,
    };
  } catch (error) {
    return {
      status: "unavailable",
      reference: error instanceof ApiError ? error.requestId : null,
    };
  }
}

/**
 * One article, by slug.
 *
 * `cache()`-deduped so `generateMetadata` and the page body share a single
 * request. A 404 is `absent` — distinct from `unavailable` — because the page
 * must call `notFound()` for the first and show an error for the second.
 */
export const getArticle = cache(async (slug: string): Promise<ArticleRead> => {
  try {
    const wire = await apiGet<ArticleDetailWire>(`/public/articles/${slug}`, {
      tags: [COLLECTION_TAGS.article, itemTag("article", slug)],
    });
    return {
      status: "ok",
      article: {
        ...toSummary(wire),
        bodyHtml: wire.body_html,
        disclaimer: wire.disclaimer,
        reviewer: toByline(wire.reviewer),
        faqs: wire.faqs,
        relatedServices: wire.related_services,
        metaTitle: wire.meta_title,
        metaDescription: wire.meta_description,
        canonicalUrl: wire.canonical_url,
        noindex: wire.noindex,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: "absent" };
    return {
      status: "unavailable",
      reference: error instanceof ApiError ? error.requestId : null,
    };
  }
});
