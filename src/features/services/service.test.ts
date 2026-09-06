import { describe, expect, it } from "vitest";

import { staticRoutes } from "@/lib/routes";

import {
  getService,
  listOtherServices,
  listServiceOptions,
  listServices,
  listServiceSlugs,
} from "./service";

/**
 * The read seam.
 *
 * These assertions are about the **contract**, not about the copy: they are
 * written so they still pass unchanged the day `listServices()` starts talking
 * to `GET /api/v1/public/services`. That is the point of testing the seam rather
 * than the pages — a component test would have to be rewritten, these do not.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("listServices", () => {
  it("returns the practice areas", async () => {
    const services = await listServices();
    expect(services.length).toBeGreaterThan(0);
  });

  it("gives every service a unique, URL-safe slug", async () => {
    const services = await listServices();
    const slugs = services.map((s) => s.slug);

    for (const slug of slugs) expect(slug).toMatch(SLUG_PATTERN);
    // A duplicate slug means two services share a URL and one is unreachable —
    // silently, and only on the page that happens to lose.
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every service the content each detail-page section needs", async () => {
    // Every section returns null on an empty array, so a missing field would not
    // crash — it would silently drop a section from a live page. This is what
    // catches that.
    for (const service of await listServices()) {
      expect(service.name, service.slug).not.toBe("");
      expect(service.summary, service.slug).not.toBe("");
      expect(service.overview.length, service.slug).toBeGreaterThan(0);
      expect(service.whatsIncluded.length, service.slug).toBeGreaterThan(0);
      expect(service.whoFor.length, service.slug).toBeGreaterThan(0);
      expect(service.whatYouGet.length, service.slug).toBeGreaterThan(0);
      expect(service.faqs.length, service.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every meta description inside the length a search result shows", async () => {
    for (const service of await listServices()) {
      expect(service.metaDescription.length, service.slug).toBeGreaterThan(70);
      // Google truncates around 160; a description that is cut mid-sentence in
      // the result is worse than a shorter one that finishes.
      expect(service.metaDescription.length, service.slug).toBeLessThanOrEqual(165);
    }
  });
});

describe("getService", () => {
  it("resolves a known slug", async () => {
    const [first] = await listServices();
    const found = await getService(first!.slug);
    expect(found?.slug).toBe(first!.slug);
  });

  it("returns null for an unknown slug rather than throwing", async () => {
    // The page turns this into `notFound()` inside `generateMetadata`. A throw
    // here would surface as a 500 instead of a 404.
    expect(await getService("no-such-service")).toBeNull();
  });

  it("returns null for an empty slug", async () => {
    expect(await getService("")).toBeNull();
  });
});

describe("listOtherServices", () => {
  it("never includes the service you are already on", async () => {
    for (const service of await listServices()) {
      const others = await listOtherServices(service.slug);
      expect(others.map((o) => o.slug)).not.toContain(service.slug);
    }
  });

  it("honours the limit", async () => {
    const others = await listOtherServices("audit-and-assurance", 2);
    expect(others).toHaveLength(2);
  });
});

describe("listServiceSlugs", () => {
  it("matches the slugs `generateStaticParams` will prerender", async () => {
    const services = await listServices();
    expect(await listServiceSlugs()).toEqual(services.map((s) => s.slug));
  });

  it("has a sitemap entry for every service", async () => {
    // `sitemap.ts` is generated from `staticRoutes`, so a service missing from
    // the registry ships un-indexed. This is the gate on that.
    const paths = new Set(staticRoutes.filter((r) => r.indexable).map((r) => r.path));
    for (const slug of await listServiceSlugs()) {
      expect(paths.has(`/services/${slug}`), slug).toBe(true);
    }
  });
});

describe("listServiceOptions", () => {
  it("offers exactly the services that have a page", async () => {
    const options = await listServiceOptions();
    const slugs = await listServiceSlugs();
    // An option naming a service with no page would send an enquiry about
    // something the site does not describe.
    expect(options.map((o) => o.slug)).toEqual([...slugs]);
    for (const option of options) expect(option.name).not.toBe("");
  });
});
