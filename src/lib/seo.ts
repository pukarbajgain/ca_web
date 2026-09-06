import { env } from "@/lib/env";

import { activeSocials, brand, isPresent, type Office, type Person } from "./brand";
import { routes } from "./routes";

/**
 * `seo.ts` — typed JSON-LD builders and URL helpers.
 *
 * Structured data is hand-written in the reference projects, which is how a
 * `@type` typo silently costs a rich result for a year. Typed builders make the
 * shape checkable and, more importantly, let the **honest-degradation rule reach
 * the metadata layer**: a builder that has no registration number omits the
 * property rather than emitting `"taxID": null`, and a builder with no offices
 * emits no `LocalBusiness` node at all. Search engines get exactly the claims
 * the page itself makes — never more.
 *
 * Every node carries a stable `@id` derived from the site origin, so the graph
 * can reference itself (`publisher`, `parentOrganization`) instead of repeating
 * the organisation inline on every page.
 */

type JsonLdValue = string | number | boolean | JsonLdNode | JsonLdValue[];
export type JsonLdNode = { [key: string]: JsonLdValue | undefined };

const SITE = env.NEXT_PUBLIC_SITE_URL;

/** Absolute URL for a site-relative path. `metadataBase` handles this for Next's
 *  own metadata, but JSON-LD `@id`s must be absolute and explicit. */
export function absoluteUrl(path = "/"): string {
  return path.startsWith("http")
    ? path
    : `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Stable identifiers for the graph. Never derived from a page URL, so they do
 *  not change when a page moves. */
export const ids = {
  organization: `${SITE}/#organization`,
  website: `${SITE}/#website`,
  office: (officeId: string) => `${SITE}/#office-${officeId}`,
  person: (personId: string) => `${SITE}/#person-${personId}`,
} as const;

/** Drop every undefined key so an absent fact leaves no trace in the output. */
function compact(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  ) as JsonLdNode;
}

/**
 * `AccountingService` (a subtype of `LocalBusiness` and `Organization`) is the
 * correct type for a CA practice — more specific than `Organization`, and it is
 * what carries `areaServed` and the address graph.
 */
export function organizationJsonLd(): JsonLdNode {
  const socials = activeSocials().map((s) => s.href);

  return compact({
    "@context": "https://schema.org",
    "@type": ["AccountingService", "Organization"],
    "@id": ids.organization,
    name: brand.name,
    legalName: brand.legalName,
    url: absoluteUrl(routes.home()),
    description: brand.description,
    slogan: brand.tagline,
    areaServed: { "@type": "Country", name: brand.locale.country },
    knowsLanguage: ["en", "ne"],
    currenciesAccepted: brand.locale.currency,

    // Absent facts are absent properties, not null values (CLAUDE.md §3.5).
    foundingDate: isPresent(brand.establishedYear)
      ? String(brand.establishedYear)
      : undefined,
    /* `identifier` with a named PropertyValue is the correct place for a
     * professional registration; `taxID` would be wrong (it is not a tax id)
     * and `vatID` doubly so. */
    identifier: isPresent(brand.icanRegistrationNumber)
      ? {
          "@type": "PropertyValue",
          name: "ICAN firm registration number",
          value: brand.icanRegistrationNumber,
        }
      : undefined,
    telephone: isPresent(brand.contact.phone) ? brand.contact.phone : undefined,
    email: isPresent(brand.contact.email) ? brand.contact.email : undefined,
    sameAs: socials.length > 0 ? socials : undefined,
    location:
      brand.offices.length > 0
        ? brand.offices.map((office) => ({ "@id": ids.office(office.id) }))
        : undefined,
  });
}

/** One `LocalBusiness` node per real office. Returns [] when there are none —
 *  a firm with no published address makes no location claim. */
export function officesJsonLd(offices: readonly Office[] = brand.offices): JsonLdNode[] {
  return offices.map((office) =>
    compact({
      "@context": "https://schema.org",
      "@type": "AccountingService",
      "@id": ids.office(office.id),
      name: `${brand.name} — ${office.name}`,
      parentOrganization: { "@id": ids.organization },
      address: compact({
        "@type": "PostalAddress",
        streetAddress: office.street,
        addressLocality: office.city,
        addressRegion: office.region ?? undefined,
        postalCode: office.postalCode ?? undefined,
        addressCountry: office.countryCode,
      }),
      telephone: office.phone ?? undefined,
      email: office.email ?? undefined,
      geo:
        office.latitude !== null && office.longitude !== null
          ? {
              "@type": "GeoCoordinates",
              latitude: office.latitude,
              longitude: office.longitude,
            }
          : undefined,
    }),
  );
}

/** `WebSite`, so the org and the site are distinct nodes in the graph. */
export function websiteJsonLd(): JsonLdNode {
  return compact({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ids.website,
    url: absoluteUrl(routes.home()),
    name: brand.name,
    publisher: { "@id": ids.organization },
    inLanguage: brand.locale.language,
  });
}

/** `Person` for a partner profile. Post-nominals go in `honorificSuffix`. */
export function personJsonLd(person: Person, profilePath?: string): JsonLdNode {
  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ids.person(person.id),
    name: person.name,
    honorificSuffix: person.postNominals ?? undefined,
    jobTitle: person.role,
    worksFor: { "@id": ids.organization },
    knowsAbout: person.practiceAreas.length > 0 ? [...person.practiceAreas] : undefined,
    url: profilePath ? absoluteUrl(profilePath) : undefined,
    identifier: isPresent(person.membershipNumber)
      ? {
          "@type": "PropertyValue",
          name: "ICAN membership number",
          value: person.membershipNumber,
        }
      : undefined,
  });
}

export type FaqEntry = { readonly question: string; readonly answer: string };

/** `FAQPage`. Returns null for an empty list — an empty FAQPage is a spam signal. */
export function faqJsonLd(entries: readonly FaqEntry[]): JsonLdNode | null {
  if (entries.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export type Breadcrumb = { readonly name: string; readonly path: string };

/** `BreadcrumbList`. Null for a single crumb — a one-item trail says nothing. */
export function breadcrumbJsonLd(crumbs: readonly Breadcrumb[]): JsonLdNode | null {
  if (crumbs.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type ServiceSummary = { readonly name: string; readonly description: string };

/** `ItemList` of `Service`s. Descriptive, not a claim — safe to always render. */
export function serviceListJsonLd(
  services: readonly ServiceSummary[],
): JsonLdNode | null {
  if (services.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Services offered by ${brand.name}`,
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: { "@id": ids.organization },
      },
    })),
  };
}

/**
 * Serialise for `dangerouslySetInnerHTML`.
 *
 * `<` is escaped as `<` because a `</script>` sequence inside a string
 * value would otherwise close the script tag early — the one genuine injection
 * risk in JSON-LD, and the reason this is a function rather than a bare
 * `JSON.stringify` at each call site.
 */
export function serializeJsonLd(node: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}

/**
 * `BlogPosting` for one article.
 *
 * Carries **`reviewedBy` alongside `author`**, which is the CA-specific part:
 * on published tax guidance the firm names both the person who wrote it and the
 * partner who checked it, and schema.org models that distinction directly. It
 * is also why `dateModified` matters more here than on a typical blog — a
 * reader of a filing deadline needs to know when it was last confirmed.
 */
export function articleJsonLd(article: {
  title: string;
  slug: string;
  standfirst: string | null;
  publishedAt: string | null;
  modifiedAt: string;
  author: { name: string; postNominals: string | null } | null;
  reviewer: { name: string; postNominals: string | null } | null;
}): JsonLdNode {
  const named = (person: { name: string; postNominals: string | null }) => ({
    "@type": "Person",
    name: person.postNominals ? `${person.name}, ${person.postNominals}` : person.name,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    ...(article.standfirst ? { description: article.standfirst } : {}),
    url: absoluteUrl(`/insights/${article.slug}`),
    mainEntityOfPage: absoluteUrl(`/insights/${article.slug}`),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.modifiedAt,
    ...(article.author ? { author: named(article.author) } : {}),
    ...(article.reviewer ? { reviewedBy: named(article.reviewer) } : {}),
    publisher: { "@type": "Organization", name: brand.name },
  };
}
