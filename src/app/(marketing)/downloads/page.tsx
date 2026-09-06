import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { DownloadIndex } from "@/features/downloads/components/download-index";
import { getDownloads } from "@/features/downloads/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

import type { Metadata } from "next";

/**
 * `/downloads` — circulars, forms, notices and reference documents.
 *
 * Grouped by category rather than a card grid (CLAUDE.md §3.8b): this is a
 * reference library a visitor scans for one document, and equally-sized tiles
 * would claim a one-page form and a full act extract are the same kind of
 * thing.
 *
 * ISR with the `downloads` tag, so publishing in the admin invalidates this
 * page through `/api/revalidate` rather than waiting out the window.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Downloads",
  description: `Circulars, forms, notices and reference documents published by ${brand.name}.`,
  alternates: { canonical: routes.downloads() },
};

export default async function DownloadsPage() {
  const read = await getDownloads({ pageSize: 100 });

  return (
    <>
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: "Downloads", path: routes.downloads() },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-16 md:px-10 md:py-24">
          <p className="text-label-medium text-tertiary uppercase">Downloads</p>
          <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
            Circulars, forms and reference documents.
          </h1>
          <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
            The notices and paperwork we are asked for most often, in one place.
          </p>
        </div>
      </header>

      <DownloadIndex read={read} />
      <CtaBand />
    </>
  );
}
