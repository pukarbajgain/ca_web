import { getArticles } from "@/features/insights/service";
import { getTeamMembers } from "@/features/team/service";
import { readAllPages } from "@/lib/paginate";
import { routes, staticRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

import type { MetadataRoute } from "next";

/**
 * Sitemap: the static routes from the registry, plus every published article
 * and person from the API.
 *
 * Hand-maintaining a sitemap guarantees that one day a page ships un-indexed —
 * the reference site re-declares its base URL in three files and lists five
 * routes by hand. Here, adding a route to `staticRoutes` adds it to the sitemap,
 * and the `indexable` flag it already carries decides whether it appears at all.
 * That flag is read by `robots.ts` too, so the sitemap can never advertise a
 * URL that robots.txt disallows — a contradiction that wastes crawl budget and
 * looks like misconfiguration to a crawler, because it is.
 *
 * **The API-sourced half is not optional.** `/insights/[slug]` is the
 * SEO-critical surface of this site (ARCHITECTURE.md §D.1), and a sitemap that
 * lists the index but none of the articles is a sitemap that omits the only
 * pages anybody searches for. This shipped that way for a while; it was not
 * noticed because the file looked complete.
 */
export const revalidate = 3600;

/**
 * The API caps `page_size` at 100, so the sitemap pages.
 *
 * This is written out because the obvious version is silently wrong: asking for
 * `page_size=1000` returns **422**, the read reports `unavailable`, and the
 * sitemap renders with its static routes and not one article — a complete-looking
 * file with the SEO-critical half missing. That is exactly what happened here,
 * and nothing about the output said so.
 *
 * The page count is bounded rather than "until exhausted": a sitemap is a public
 * endpoint, and an unbounded loop over an API is a request that gets slower as
 * the firm publishes. 1,000 URLs is far beyond what this practice will hold, and
 * the 50,000-per-file sitemap limit is the ceiling that would eventually matter.
 */
const PAGE_SIZE = 100;
const PAGING = { pageSize: PAGE_SIZE, maxPages: 10 } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = staticRoutes
    .filter((route) => route.indexable)
    .map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  /**
   * Both reads are `unavailable`-tolerant by construction, and that is the
   * right degradation here: a sitemap missing its articles for one hour is
   * recoverable, and a sitemap that 500s teaches a crawler to stop asking.
   * Nothing is fabricated — an outage simply contributes no rows.
   */
  const [articles, team] = await Promise.all([
    readAllPages((page) => getArticles({ page, pageSize: PAGE_SIZE }), PAGING),
    readAllPages((page) => getTeamMembers({ page, pageSize: PAGE_SIZE }), PAGING),
  ]);

  const articleEntries = articles.map((article) => ({
    url: absoluteUrl(routes.article(article.slug)),
    // The article's own last edit, not "now": `lastModified` is a claim about
    // the content, and stamping every URL with the request time tells a crawler
    // the whole site changed every hour, which is how a sitemap stops being
    // believed.
    lastModified: new Date(article.modifiedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const teamEntries = team.map((member) => ({
    url: absoluteUrl(routes.person(member.slug)),
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries, ...teamEntries];
}
