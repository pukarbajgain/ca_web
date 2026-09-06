import { absoluteUrl, ids, type JsonLdNode } from "@/lib/seo";

import type { Service } from "./types";

/**
 * The `Service` node for a detail page.
 *
 * `lib/seo.ts` already builds an `ItemList` of services for the *index*
 * (`serviceListJsonLd`). A detail page needs the singular type instead: an
 * `ItemList` on a page that describes one thing is a mismatch a validator will
 * accept and a rich-result pipeline will ignore.
 *
 * It lives here rather than in `lib/seo.ts` because it is the only builder that
 * needs the feature's domain type. If a second feature ever needs it, promote it
 * — the `@id` and `absoluteUrl` helpers it composes are already shared.
 *
 * **No claim is made that the page does not make.** `provider` references the
 * organisation node by `@id`, so the registration number, telephone and offices
 * come from `organizationJsonLd()` — which already omits every absent fact
 * (CLAUDE.md §3.5). Nothing is restated here, so nothing can drift.
 */
export function serviceJsonLd(service: Service, path: string): JsonLdNode {
  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name: service.name,
    description: service.metaDescription,
    url: absoluteUrl(path),
    serviceType: service.name,
    provider: { "@id": ids.organization },
    areaServed: { "@type": "Country", name: "Nepal" },
  };

  /* `hasOfferCatalog` is the correct place for the sub-services, and it is
   * omitted entirely rather than emitted empty when there are none — an empty
   * catalogue asserts "this service contains nothing", which is false. */
  if (service.whatsIncluded.length > 0) {
    node.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${service.name} — what's included`,
      itemListElement: service.whatsIncluded.map((inclusion) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: inclusion.title,
          description: inclusion.detail,
        },
      })),
    };
  }

  return node;
}
