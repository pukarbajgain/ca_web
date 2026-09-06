import { describe, expect, it } from "vitest";

import {
  activeSocials,
  brand,
  isPresent,
  mailHref,
  telHref,
  whatsAppHref,
} from "./brand";

/**
 * These are the regression tests for CLAUDE.md §3.5. They will start failing
 * the day someone fills in the firm's real details — and at that point they
 * should be *changed*, not deleted: the assertions about `null` become
 * assertions about the real value, and the `isPresent` contract stays.
 */

describe("honest degradation", () => {
  it("ships every verifiable fact as absent rather than invented", () => {
    expect(brand.icanRegistrationNumber).toBeNull();
    expect(brand.panNumber).toBeNull();
    expect(brand.establishedYear).toBeNull();
    expect(brand.contact.phone).toBeNull();
    expect(brand.contact.whatsapp).toBeNull();
    expect(brand.contact.email).toBeNull();
    expect(brand.offices).toHaveLength(0);
    expect(brand.people).toHaveLength(0);
    expect(brand.stats).toHaveLength(0);
  });

  it("flags the placeholder identity so the audit can report it", () => {
    expect(brand.isPlaceholderIdentity).toBe(true);
  });

  it("keeps descriptive copy populated — absence is for claims, not for prose", () => {
    expect(brand.tagline.length).toBeGreaterThan(10);
    expect(brand.intro).toHaveLength(2);
    expect(brand.disclaimer.length).toBeGreaterThan(80);
  });

  it("uses no superlative or comparative claim in the tagline or description", () => {
    // ICAN restricts advertising; these words are the usual offenders.
    const banned =
      /\b(best|leading|number one|no\.? ?1|top|premier|finest|unrivalled)\b/i;
    expect(brand.tagline).not.toMatch(banned);
    expect(brand.description).not.toMatch(banned);
    for (const paragraph of brand.intro) expect(paragraph).not.toMatch(banned);
  });
});

describe("isPresent", () => {
  it("treats null, undefined, blank strings and empty arrays as absent", () => {
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent("   ")).toBe(false);
    expect(isPresent([])).toBe(false);
  });

  it("treats real values as present, including 0 and false", () => {
    // A zero statistic is still a published figure; suppressing it would be a
    // different bug from suppressing an absent one.
    expect(isPresent(0)).toBe(true);
    expect(isPresent(false)).toBe(true);
    expect(isPresent("x")).toBe(true);
    expect(isPresent(["x"])).toBe(true);
  });
});

describe("contact hrefs", () => {
  it("returns null for every channel the firm has not published", () => {
    expect(telHref()).toBeNull();
    expect(whatsAppHref()).toBeNull();
    expect(mailHref()).toBeNull();
  });
});

describe("socials", () => {
  it("is opt-in: an entry without a URL is never returned", () => {
    // A social icon that 404s is worse than no icon, and guessing a handle can
    // point visitors at an account somebody else owns.
    expect(activeSocials()).toHaveLength(0);
    expect(brand.socials.length).toBeGreaterThan(0);
  });
});

describe("Nepal locale constants", () => {
  it("records the settled jurisdiction facts (CLAUDE.md §3.4)", () => {
    expect(brand.locale.timeZone).toBe("Asia/Kathmandu");
    expect(brand.locale.utcOffset).toBe("+05:45");
    expect(brand.locale.currency).toBe("NPR");
    // Sunday–Friday working week: Saturday is the weekend, not Sat+Sun.
    expect(brand.locale.weekend).toEqual(["saturday"]);
  });
});
