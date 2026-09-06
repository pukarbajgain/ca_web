import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` — merge class names, letting a later Tailwind utility beat an earlier one
 * in the same group.
 *
 * ── Why this is `extendTailwindMerge` and not the two-line default ──────────
 * tailwind-merge classifies a class by *pattern*, and it only knows the stock
 * scales. Our type scale is tokenised (`text-display-large` … `text-label-small`
 * from `@theme inline`), and none of those match tailwind-merge's font-size
 * heuristic — so it files them under **text-color** instead. The result is a
 * genuinely nasty silent bug:
 *
 *     cn("text-primary-foreground", "text-label-large")
 *       → "text-label-large"        // the colour is discarded as a "conflict"
 *
 * which is exactly how `<Button variant="primary">` ended up rendering
 * near-black text on the deep teal primary — a 1.73:1 contrast failure that the
 * type checker, the linter and the build all passed, and only the axe gate
 * caught. Teaching tailwind-merge the project's scales fixes the whole class of
 * bug rather than the one instance.
 *
 * The same applies to the elevation vocabulary (`shadow-e1`…`e3`), which would
 * otherwise be filed under shadow-*colour*.
 *
 * Keep these lists in step with the `@theme inline` block in `globals.css`;
 * `src/lib/utils.test.ts` asserts the pairing that actually broke.
 */

/** The tokenised type scale. Mirrors `--text-*` in globals.css. */
const FONT_SIZES = [
  "display-large",
  "display-medium",
  "display-small",
  "headline-large",
  "headline-medium",
  "headline-small",
  "title-large",
  "title-medium",
  "title-small",
  "body-large",
  "body-medium",
  "body-small",
  "label-large",
  "label-medium",
  "label-small",
] as const;

/** The elevation vocabulary. Mirrors `--shadow-e*` in globals.css. */
const SHADOWS = ["e1", "e2", "e3"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
      shadow: [{ shadow: [...SHADOWS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
