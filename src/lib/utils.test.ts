import { describe, expect, it } from "vitest";

import { cn } from "./utils";

/**
 * Regression tests for a bug that shipped invisible text.
 *
 * tailwind-merge only knows the stock scales, so it filed every step of our
 * tokenised type scale under *text-colour* and discarded any real colour class
 * paired with one. `<Button variant="primary">` therefore rendered
 * `text-label-large` alone — inheriting near-black on the deep teal primary, a
 * 1.73:1 contrast failure. See `cn`'s header comment.
 */
describe("cn", () => {
  it("keeps a text colour and a tokenised text size together", () => {
    const result = cn("text-primary-foreground", "text-label-large");
    expect(result).toContain("text-primary-foreground");
    expect(result).toContain("text-label-large");
  });

  it("still resolves a genuine conflict between two type steps", () => {
    expect(cn("text-body-large", "text-body-small")).toBe("text-body-small");
  });

  it("still resolves a genuine conflict between two colours", () => {
    expect(cn("text-on-surface", "text-primary")).toBe("text-primary");
  });

  it("keeps an elevation token alongside a background colour", () => {
    const result = cn("bg-card", "shadow-e2");
    expect(result).toContain("bg-card");
    expect(result).toContain("shadow-e2");
  });

  it("lets a caller's className override a component default", () => {
    // The whole reason `cn` exists rather than a template string.
    expect(cn("p-5", "p-8")).toBe("p-8");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
