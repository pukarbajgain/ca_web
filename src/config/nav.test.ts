import { describe, expect, it } from "vitest";

import { routes, staticRoutes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

import { isActivePath, legalNav, primaryNav } from "./nav";

describe("navigation", () => {
  it("points every nav item at a route from the registry", () => {
    // Catches the failure mode `routes.ts` exists to prevent: a hand-typed href
    // that drifts from the real path and 404s silently.
    const known = new Set(Object.values(routes).map((build) => build("x")));
    for (const item of [...primaryNav, ...legalNav]) {
      expect(known.has(item.href)).toBe(true);
    }
  });

  it("labels every item from the vocabulary, so a Nepali build is a data change", () => {
    // `vocabulary.legal.copyright` is a formatter, not a label — filter to the
    // string entries rather than widening the type and losing the check.
    const legalLabels = Object.values<unknown>(vocabulary.legal).filter(
      (value): value is string => typeof value === "string",
    );
    const labels = new Set<string>([...Object.values(vocabulary.nav), ...legalLabels]);
    for (const item of [...primaryNav, ...legalNav]) {
      expect(labels.has(item.label)).toBe(true);
    }
  });

  it("lists no duplicate destinations", () => {
    const hrefs = primaryNav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("declares sitemap metadata for every legal route", () => {
    const sitemapPaths = new Set(staticRoutes.map((route) => route.path));
    for (const item of legalNav) {
      expect(sitemapPaths.has(item.href)).toBe(true);
    }
  });
});

describe("isActivePath", () => {
  it("matches the homepage exactly, not by prefix", () => {
    expect(isActivePath("/", "/")).toBe(true);
    // Every path starts with "/" — a prefix test would light up Home forever.
    expect(isActivePath("/services", "/")).toBe(false);
  });

  it("matches a section and its descendants", () => {
    expect(isActivePath("/insights", "/insights")).toBe(true);
    expect(isActivePath("/insights/vat-deadlines", "/insights")).toBe(true);
  });

  it("does not match a sibling that shares a prefix", () => {
    expect(isActivePath("/services-old", "/services")).toBe(false);
  });
});
