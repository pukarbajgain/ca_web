/**
 * `brand-marks.ts` — the geometry of the logo, in one place.
 *
 * The mark has to exist in two forms and they must not drift:
 *
 *  1. **Inline SVG in the page**, where `currentColor` actually works. An SVG
 *     referenced through `<img src>` is a separate document: it cannot see the
 *     page's `color`, so `currentColor` there resolves to black and the mark
 *     goes invisible in dark mode. The header and footer therefore render the
 *     mark as JSX (`components/brand/`), not as an image.
 *  2. **A static file in `public/brand/`**, for the favicon, the web manifest
 *     and anything that can only take a URL.
 *
 * Both are generated from the path data below (`pnpm assets:generate`), so a
 * real logo replaces one set of coordinates and both outputs follow.
 *
 * The placeholder mark is drawn from the ledger-rule motif the hero uses: three
 * centred rules of increasing width, which read simultaneously as a ruled ledger
 * and as the triangle in the placeholder name. Replacement contract: keep the
 * viewBox ratio and nothing in the layout moves (ARCHITECTURE.md §J.4.5).
 */

export const MONOGRAM_VIEWBOX = "0 0 64 64";
/** Ratio the wordmark box is locked to; mirrors `imageSlots.wordmark`. */
export const WORDMARK_VIEWBOX = "0 0 1000 200";

/** Rounded badge outline. Drawn at reduced opacity so the rules stay dominant. */
export const MONOGRAM_BADGE = {
  x: 2.5,
  y: 2.5,
  size: 59,
  radius: 14,
  strokeWidth: 3,
  opacity: 0.3,
} as const;

/** Three centred ledger rules: [x, y, width]. Height and radius are uniform. */
export const MONOGRAM_RULES: readonly (readonly [x: number, y: number, w: number])[] = [
  [26, 17, 12],
  [18, 30, 28],
  [10, 43, 44],
] as const;

export const MONOGRAM_RULE_HEIGHT = 4;

/** Type metrics for the wordmark's lettering, shared by both outputs. */
export const WORDMARK_TYPE = {
  /** Mark occupies a 160px square at the left of the 1000×200 box. */
  markSize: 160,
  markOffsetY: 20,
  textX: 196,
  /** Baseline, not top edge — SVG text is positioned from the baseline. */
  textBaselineY: 124,
  fontSize: 64,
  letterSpacing: -1.2,
  /** Inline form uses the loaded display face; the static file falls back. */
  fontFamilyInline: "var(--font-serif), Georgia, serif",
  fontFamilyStatic: "'Source Serif 4', Georgia, 'Times New Roman', serif",
} as const;
