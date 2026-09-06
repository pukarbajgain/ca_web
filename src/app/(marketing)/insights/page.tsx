import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { InsightIndex } from "@/features/insights/components/insight-index";
import { getArticles } from "@/features/insights/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

import type { Metadata } from "next";

/**
 * `/insights` — the firm's published articles.
 *
 * **This is the page the CMS exists for.** Everything else on the site is
 * written once; this is written weekly, and it is the reason an editor logs in.
 *
 * The register is a ruled list rather than a card grid, deliberately — see
 * `insight-index.tsx`. Filtering by category and searching are the next thing
 * this page needs, and they are not here yet: with a handful of articles a
 * filter bar is chrome above a list you can read in full, and it would ship a
 * control that makes the page look busier without making it more useful. It
 * arrives when the archive does.
 *
 * ISR with the `articles` tag, so publishing in the admin invalidates this page
 * through `/api/revalidate` rather than waiting out the window (§C.3).
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Insights",
  description: `Notes on tax, audit and compliance in Nepal from ${brand.name}.`,
  alternates: { canonical: routes.insights() },
};

export default async function InsightsPage() {
  const read = await getArticles({ pageSize: 20 });

  return (
    <>
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Insights", path: routes.insights() },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-16 md:px-10 md:py-24">
          <p className="text-label-medium text-tertiary uppercase">Insights</p>
          <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
            Notes on tax, audit and compliance in Nepal.
          </h1>
          <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
            Written by the people who do the work, and checked before they go out.
          </p>
        </div>
      </header>

      <InsightIndex read={read} />
      <CtaBand />
    </>
  );
}
