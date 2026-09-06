import { disallowedPaths, routes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

import type { MetadataRoute } from "next";

/**
 * robots.txt.
 *
 * The disallow list is derived from the same registry as the sitemap, so the
 * two cannot disagree. `/api/` is disallowed because the revalidate handler is
 * not content and a crawler hitting it wastes budget on a 401.
 *
 * Deliberately **not** blocking AI crawlers by name. That list needs a business
 * decision rather than an engineering one, and a stale allow/deny list of
 * user-agents is worse than none.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...disallowedPaths] }],
    sitemap: absoluteUrl(routes.sitemap()),
    host: absoluteUrl(),
  };
}
