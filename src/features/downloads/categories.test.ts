import { describe, expect, it } from "vitest";

import {
  assertEveryCategoryIsLabelled,
  DOWNLOAD_CATEGORY_LABELS,
  DOWNLOAD_CATEGORY_ORDER,
} from "./categories";
import { DOWNLOAD_CATEGORIES } from "./types";

/**
 * The failure this guards against: a category added to the backend enum with
 * no matching entry here would not crash — it would silently drop every
 * download in that category from the grouped `/downloads` view. Totality is
 * therefore a test, not a code-review nicety.
 */
describe("download categories", () => {
  it("orders every declared category exactly once", () => {
    expect([...DOWNLOAD_CATEGORY_ORDER].sort()).toEqual([...DOWNLOAD_CATEGORIES].sort());
    expect(new Set(DOWNLOAD_CATEGORY_ORDER).size).toBe(DOWNLOAD_CATEGORY_ORDER.length);
  });

  it("gives every declared category a non-raw, reader-facing label", () => {
    for (const category of DOWNLOAD_CATEGORIES) {
      const label = DOWNLOAD_CATEGORY_LABELS[category];
      expect(label, category).toBeTruthy();
      // A raw enum value must never reach the UI (CLAUDE.md §5.2).
      expect(label).not.toBe(category);
      expect(label).not.toContain("_");
    }
  });

  it("does not throw the totality assertion", () => {
    expect(() => assertEveryCategoryIsLabelled()).not.toThrow();
  });

  it("puts 'Other' last, regardless of how few items it holds", () => {
    expect(DOWNLOAD_CATEGORY_ORDER.at(-1)).toBe("other");
  });
});
