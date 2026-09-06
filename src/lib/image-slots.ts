/**
 * `image-slots.ts` — every image position on the site, with a **locked aspect
 * ratio and declared intrinsic size** (ARCHITECTURE.md §J.4.2).
 *
 * The point is structural, not cosmetic. Because the slot fixes the box, the
 * layout is reserved before any pixel arrives, so:
 *
 *   - swapping a placeholder for real photography can never shift the layout
 *     (CLS is zero by construction, not by luck), and
 *   - art that is the wrong shape is caught at upload by the admin's spec check
 *     rather than discovered on the live site.
 *
 * `intrinsic` is the size the *generated placeholder* is drawn at and the size
 * real art should be supplied at. `ratio` is the contract; `intrinsic` is the
 * recommendation. They must agree, and a test asserts that they do.
 */

export type ImageSlotName =
  | "logo"
  | "hero-landscape"
  | "partner-portrait"
  | "office-exterior"
  | "article-cover"
  | "og-image";

export type ImageSlot = {
  readonly name: ImageSlotName;
  /** Width ÷ height, as the design intends it. Rendered via `aspect-[w/h]`. */
  readonly ratio: readonly [width: number, height: number];
  /** Intrinsic pixel size of the asset. */
  readonly intrinsic: { readonly width: number; readonly height: number };
  /** What goes here, for the handover checklist `pnpm assets:audit` prints. */
  readonly description: string;
  /**
   * True for marks that are drawn, not photographed. Vector slots are exempt
   * from the ratio assertion because their box is set by cap-height, and they
   * bypass the image optimizer entirely (see next.config.ts on SVG).
   */
  readonly vector: boolean;
};

export const imageSlots = {
  /**
   * The firm's actual logo: the stacked lockup, mark over wordmark.
   *
   * Raster rather than vector, because that is the form it was supplied in.
   * The ratio is measured from the file with its transparent padding trimmed
   * off — untrimmed it was 2.000, and the padding is why an earlier draft
   * rendered the wordmark too small to read inside a header-height box.
   */
  logo: {
    name: "logo",
    ratio: [411, 211],
    intrinsic: { width: 1644, height: 844 },
    description: "Primary logo lockup, header and footer. Transparent PNG.",
    vector: false,
  },

  /**
   * The landing hero's photograph: the firm's own office, 2:1.
   */
  "hero-landscape": {
    name: "hero-landscape",
    ratio: [2, 1],
    intrinsic: { width: 2560, height: 1280 },
    description: "Wide hero art for tablet and desktop.",
    vector: false,
  },

  "partner-portrait": {
    name: "partner-portrait",
    ratio: [4, 5],
    intrinsic: { width: 1200, height: 1500 },
    description: "Partner and staff portraits. Head and shoulders, plain ground.",
    vector: false,
  },
  "office-exterior": {
    name: "office-exterior",
    ratio: [3, 2],
    intrinsic: { width: 1800, height: 1200 },
    description: "Office exterior or reception. One per office.",
    vector: false,
  },
  "article-cover": {
    name: "article-cover",
    ratio: [16, 9],
    intrinsic: { width: 1920, height: 1080 },
    description: "Insight article cover, listing card and article header.",
    vector: false,
  },
  /**
   * 1200×630 is 1.9047…:1, which is what every social scraper expects. It is
   * written as the exact pixel pair rather than a reduced ratio because the
   * platforms validate the pixel size, not the ratio.
   */
  "og-image": {
    name: "og-image",
    ratio: [1200, 630],
    intrinsic: { width: 1200, height: 630 },
    description: "Open Graph / Twitter card image. 1200×630 exactly.",
    vector: false,
  },
} as const satisfies Record<ImageSlotName, ImageSlot>;

/** CSS aspect-ratio value, e.g. "4 / 5". Feeds the media wrapper's box. */
export function slotAspect(slot: ImageSlot): string {
  return `${slot.ratio[0]} / ${slot.ratio[1]}`;
}

/** Ratio as a number, for assertions and for choosing an art-direction crop. */
export function slotRatio(slot: ImageSlot): number {
  return slot.ratio[0] / slot.ratio[1];
}
