import type { InsightSummary } from "@/components/sections/insight-rail";
import { assetOrPlaceholder, assets } from "@/lib/assets";

import type { ArticleSummary } from "./service";

/**
 * Articles → the shape the homepage rail renders.
 *
 * A mapper rather than a second fetch: the rail's `InsightSummary` is a *view*
 * type, narrower than the domain `ArticleSummary` and shaped by what a card
 * shows. Keeping the translation here rather than in `page.tsx` is what lets the
 * page stay a shell (ARCHITECTURE.md §D.2) — the page asks for articles and
 * hands them over, and nothing about card fields leaks into it.
 *
 * `import type` for the view shape, so importing it here does not drag the
 * component's own imports into this module's graph.
 */
export function toInsightSummaries(
  articles: readonly ArticleSummary[],
): readonly InsightSummary[] {
  return (
    articles
      /* A card leads with its date, so an article with no publication date has
       * nothing to lead with. There should not be one — the public list only
       * returns published articles — and dropping it is still better than
       * rendering a card with a blank line where the date belongs. */
      .filter((article) => article.publishedAt !== null)
      .map((article) => ({
        slug: article.slug,
        title: article.title,
        excerpt: article.standfirst ?? "",
        publishedAt: article.publishedAt as string,
        topic: article.category?.name ?? null,
        /* Both dimensions or neither — `assetOrPlaceholder` needs a real box to
         * keep CLS at zero, and half a known size is worse than none: it would
         * reserve a wrong box rather than the slot's correct one. Same rule
         * `TeamPortrait` applies to a person's photograph. */
        cover: assetOrPlaceholder(
          article.cover && article.cover.width !== null && article.cover.height !== null
            ? {
                url: article.cover.url,
                width: article.cover.width,
                height: article.cover.height,
                alt_text: article.cover.alt,
              }
            : null,
          assets.articleCover,
          "",
        ),
        author: article.author?.name ?? null,
        /* Only when it differs from publication: "Updated" on the same day as
         * "Published" is noise, and on tax guidance the update date is the one a
         * reader actually cares about. */
        updatedAt:
          article.modifiedAt && article.modifiedAt !== article.publishedAt
            ? article.modifiedAt
            : null,
      }))
  );
}
