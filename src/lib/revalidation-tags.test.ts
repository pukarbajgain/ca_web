import { describe, expect, it } from "vitest";

import {
  COLLECTION_TAGS,
  isRevalidatableType,
  isValidSlug,
  itemTag,
  REVALIDATABLE_TYPES,
  tagsForEvent,
} from "./revalidation-tags";

/**
 * The failure this guards against is the one ARCHITECTURE.md §P.3 calls "the
 * classic": published content that never appears, because the tag the webhook
 * invalidated is not the tag the fetch declared. Keeping both sides reading the
 * same map, and asserting the map is total, is the cheap half of the fix.
 */

describe("type allowlist", () => {
  it("accepts every declared type and nothing else", () => {
    for (const type of REVALIDATABLE_TYPES) {
      expect(isRevalidatableType(type)).toBe(true);
    }
    expect(isRevalidatableType("article; DROP TABLE")).toBe(false);
    expect(isRevalidatableType(undefined)).toBe(false);
    expect(isRevalidatableType(42)).toBe(false);
  });

  it("has a collection tag for every declared type", () => {
    for (const type of REVALIDATABLE_TYPES) {
      expect(COLLECTION_TAGS[type]).toBeTruthy();
    }
  });
});

describe("slug validation", () => {
  it("accepts a normal kebab-case slug", () => {
    expect(isValidSlug("vat-return-deadlines-2083")).toBe(true);
  });

  it("rejects shapes that would widen the cache key space", () => {
    expect(isValidSlug("Has Spaces")).toBe(false);
    expect(isValidSlug("trailing-")).toBe(false);
    expect(isValidSlug("../../etc/passwd")).toBe(false);
    expect(isValidSlug("a".repeat(200))).toBe(false);
    expect(isValidSlug(123)).toBe(false);
  });
});

describe("tagsForEvent", () => {
  it("always invalidates the collection, because the listing changed too", () => {
    expect(tagsForEvent("article", "some-slug")).toContain(COLLECTION_TAGS.article);
  });

  it("adds the item tag, matching what the fetch site declares", () => {
    expect(tagsForEvent("article", "some-slug")).toContain(
      itemTag("article", "some-slug"),
    );
  });

  it("drops an invalid slug but still refreshes the listing", () => {
    // Refusing the whole request would leave the site stale over a formatting nit.
    expect(tagsForEvent("article", "Bad Slug")).toEqual([COLLECTION_TAGS.article]);
  });

  it("never produces an item tag for settings, which is a singleton", () => {
    expect(tagsForEvent("settings", "anything")).toEqual([COLLECTION_TAGS.settings]);
  });

  it("never returns an empty tag list for a valid type", () => {
    for (const type of REVALIDATABLE_TYPES) {
      expect(tagsForEvent(type).length).toBeGreaterThan(0);
    }
  });
});
