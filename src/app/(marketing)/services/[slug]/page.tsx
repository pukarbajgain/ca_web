import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { OtherServices } from "@/features/services/components/other-services";
import { ServiceAudienceSection } from "@/features/services/components/service-audience";
import { ServiceDeliverables } from "@/features/services/components/service-deliverables";
import { ServiceFaqs } from "@/features/services/components/service-faqs";
import { ServiceHero } from "@/features/services/components/service-hero";
import { ServiceInclusions } from "@/features/services/components/service-inclusions";
import { ServiceOverview } from "@/features/services/components/service-overview";
import { serviceJsonLd } from "@/features/services/seo";
import {
  getService,
  listOtherServices,
  listServiceSlugs,
} from "@/features/services/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { vocabulary } from "@/lib/vocabulary";

import type { Metadata } from "next";

/**
 * `/services/[slug]` — one practice area.
 *
 * Section order follows the structure ARCHITECTURE.md §A.5 found on **every**
 * reference CA site, because it matches the order a prospect's questions
 * actually arrive in: what is this → what does it cover → is it for me → what do
 * I end up with → what am I still unsure about → what else do you do → talk to
 * us.
 *
 * ── The 404 mechanism, and why it is in `generateMetadata` ──────────────────
 * `getService` is `cache()`-deduped, so `generateMetadata` and the body share
 * one read. `notFound()` is called from `generateMetadata` — the first of the
 * two to run — which is what makes an unknown slug a **real 404 with a 404
 * status**. Calling it only in the body produces a *soft* 404: the metadata pass
 * has already committed a 200 and a `<title>`, so a crawler records a successful
 * page that happens to say "not found". That is the single most expensive SEO
 * bug on a content site, and ARCHITECTURE.md §D.5 names this pattern
 * specifically. The body keeps its own guard because TypeScript cannot know the
 * metadata pass already ran.
 *
 * ── Why `dynamicParams = false` is also needed, and it is not belt-and-braces ─
 * `notFound()` alone was **verified not to be enough here**. With
 * `dynamicParams` at its default (`true`), Next 16.3.4 renders the not-found
 * page for an unknown param and serves it with **HTTP 200** — measured against
 * the standalone bundle, with and without the `revalidate` export, and with
 * `notFound()` in `generateMetadata`, in the body, or in both. A missing route
 * with no segment at all (`/nonsense`) correctly returns 404, so this is
 * specific to a prerendered dynamic segment accepting unknown params.
 *
 * A 200 that says "not found" is precisely the soft 404 this page is supposed to
 * avoid: a crawler records a successful page and keeps it in the index.
 * `dynamicParams = false` makes Next itself reject any param outside
 * `generateStaticParams` with a real 404 — confirmed 404 for an unknown slug and
 * 200 for every real one.
 *
 * The `notFound()` calls stay, and they are not dead: they are the mechanism in
 * `next dev`, and they are what carries the correct behaviour the day services
 * move to the CMS and this flag has to flip back to `true` so a newly-published
 * slug renders without a redeploy. **When it flips, re-measure the status code**
 * — that is the whole reason this note exists rather than a bare flag.
 */
export const revalidate = 300;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await listServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  // A real 404, committed before any HTML or <title> exists. See above.
  if (!service) notFound();

  const path = routes.service(service.slug);

  return {
    title: service.name,
    description: service.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: `${service.name} — ${brand.name}`,
      description: service.metaDescription,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const others = await listOtherServices(service.slug);
  const path = routes.service(service.slug);

  const trail = [
    { name: "Home", path: routes.home() },
    { name: vocabulary.nav.services, path: routes.services() },
    { name: service.name, path },
  ];

  return (
    <>
      {/* One graph, built from the same arrays the page renders — so the
          structured data cannot claim a scope, an FAQ or a trail that the
          reader is not shown. `faqJsonLd` returns null on an empty list (an
          empty FAQPage is a spam signal) and `JsonLd` drops nulls. */}
      <JsonLd
        nodes={[
          serviceJsonLd(service, path),
          breadcrumbJsonLd(trail),
          faqJsonLd(service.faqs),
        ]}
      />

      <ServiceHero service={service} trail={trail} />
      <ServiceOverview paragraphs={service.overview} />
      <ServiceInclusions inclusions={service.whatsIncluded} />
      <ServiceAudienceSection audiences={service.whoFor} />
      <ServiceDeliverables items={service.whatYouGet} />
      <ServiceFaqs faqs={service.faqs} serviceName={service.name} />
      <OtherServices services={others} />
      <CtaBand />
    </>
  );
}
