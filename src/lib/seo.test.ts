import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  ids,
  officesJsonLd,
  organizationJsonLd,
  personJsonLd,
  serializeJsonLd,
  serviceListJsonLd,
  websiteJsonLd,
} from "./seo";

import type { Office, Person } from "./brand";

/**
 * The rule under test is CLAUDE.md §3.5, applied to structured data: **an
 * absent fact must be an absent property, never a null value.** A crawler
 * treats `"foundingDate": null` as malformed and can treat a claim the page
 * does not make as a mismatch. These assertions are what stop a future
 * refactor from spreading the whole `brand` object into a node.
 */

const OFFICE: Office = {
  id: "ktm",
  name: "Kathmandu",
  street: "Sample Marg 1",
  city: "Kathmandu",
  region: "Bagmati",
  postalCode: null,
  countryCode: "NP",
  phone: "+9771000000",
  email: null,
  latitude: null,
  longitude: null,
  isPrimary: true,
};

const PERSON: Person = {
  id: "p1",
  name: "Sample Partner",
  postNominals: "FCA",
  role: "Managing partner",
  practiceAreas: ["Audit"],
  membershipNumber: null,
};

describe("organizationJsonLd", () => {
  const node = organizationJsonLd();

  it("types the firm as an AccountingService, not a bare Organization", () => {
    expect(node["@type"]).toEqual(["AccountingService", "Organization"]);
  });

  it("omits every unpublished fact rather than emitting null", () => {
    // brand.ts ships these as null; the property must not be present at all.
    expect(node).not.toHaveProperty("foundingDate");
    expect(node).not.toHaveProperty("identifier");
    expect(node).not.toHaveProperty("telephone");
    expect(node).not.toHaveProperty("email");
    expect(node).not.toHaveProperty("sameAs");
    expect(node).not.toHaveProperty("location");
    expect(Object.values(node)).not.toContain(null);
  });

  it("carries a stable @id the rest of the graph can reference", () => {
    expect(node["@id"]).toBe(ids.organization);
    expect(websiteJsonLd().publisher).toEqual({ "@id": ids.organization });
  });
});

describe("officesJsonLd", () => {
  it("emits nothing when the firm has published no address", () => {
    expect(officesJsonLd([])).toEqual([]);
  });

  it("emits one node per office, linked to the organisation", () => {
    const [node] = officesJsonLd([OFFICE]);
    expect(node?.["@id"]).toBe(ids.office("ktm"));
    expect(node?.parentOrganization).toEqual({ "@id": ids.organization });
    expect(node?.telephone).toBe("+9771000000");
  });

  it("omits geo entirely when only one coordinate is known", () => {
    const [node] = officesJsonLd([{ ...OFFICE, latitude: 27.7 }]);
    // A half-coordinate places the office in the Gulf of Guinea.
    expect(node).not.toHaveProperty("geo");
  });

  it("omits a null postal code from the address", () => {
    const [node] = officesJsonLd([OFFICE]);
    expect(node?.address).not.toHaveProperty("postalCode");
  });
});

describe("personJsonLd", () => {
  it("puts post-nominals in honorificSuffix and omits an unknown membership number", () => {
    const node = personJsonLd(PERSON);
    expect(node.honorificSuffix).toBe("FCA");
    expect(node).not.toHaveProperty("identifier");
    expect(node.worksFor).toEqual({ "@id": ids.organization });
  });
});

describe("faqJsonLd and breadcrumbJsonLd", () => {
  it("returns null for an empty FAQ rather than an empty FAQPage", () => {
    expect(faqJsonLd([])).toBeNull();
  });

  it("builds a Question/Answer pair per entry", () => {
    const node = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(node?.mainEntity).toHaveLength(1);
  });

  it("returns null for a single-crumb trail, which says nothing", () => {
    expect(breadcrumbJsonLd([{ name: "Home", path: "/" }])).toBeNull();
  });

  it("numbers crumbs from 1 and absolutises their URLs", () => {
    const node = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]);
    const items = node?.itemListElement as { position: number; item: string }[];
    expect(items[0]?.position).toBe(1);
    expect(items[1]?.item).toBe(absoluteUrl("/services"));
  });
});

describe("serviceListJsonLd", () => {
  it("returns null for an empty list", () => {
    expect(serviceListJsonLd([])).toBeNull();
  });

  it("attributes every service to the organisation", () => {
    const node = serviceListJsonLd([{ name: "Audit", description: "Statutory audit." }]);
    const items = node?.itemListElement as { item: { provider: unknown } }[];
    expect(items[0]?.item.provider).toEqual({ "@id": ids.organization });
  });
});

describe("serializeJsonLd", () => {
  it("escapes '<' so a value can never close the script tag early", () => {
    const output = serializeJsonLd({ name: "</script><img onerror=alert(1)>" });
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c");
  });

  it("round-trips to the same object after escaping", () => {
    const node = { name: "a < b", nested: { "@id": "x" } };
    expect(JSON.parse(serializeJsonLd(node))).toEqual(node);
  });
});

describe("absoluteUrl", () => {
  it("prefixes a site-relative path with the configured origin", () => {
    expect(absoluteUrl("/services")).toBe("https://example.test/services");
  });

  it("tolerates a missing leading slash", () => {
    expect(absoluteUrl("services")).toBe("https://example.test/services");
  });

  it("passes an already-absolute URL through untouched", () => {
    expect(absoluteUrl("https://other.test/x")).toBe("https://other.test/x");
  });
});
