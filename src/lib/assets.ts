import { imageSlots, type ImageSlot, type ImageSlotName } from "@/lib/image-slots";

/**
 * `assets.ts` — the ONE registry of image paths (ARCHITECTURE.md §J.4.1).
 *
 * **No component may reference an image path.** Components accept an
 * `AssetDescriptor` and nothing else; ESLint enforces the other half of the rule
 * by banning `next/image` outside `components/media/`. Replacing an asset is
 * therefore one line here, and the box it renders into cannot change because the
 * slot owns the geometry.
 *
 * `focal` exists because a 4:5 portrait cropped to a 1:1 avatar cuts someone's
 * chin off if the crop is centred. A focal point is ~5 lines of `object-position`
 * versus a crop library, it is non-destructive, and it composes with responsive
 * re-cropping (the `ecommerce_admin` finding, §"Patterns borrowed").
 */

export type FocalPoint = {
  /** 0 = left edge, 1 = right edge. */
  readonly x: number;
  /** 0 = top edge, 1 = bottom edge. Portraits usually want ~0.3, not 0.5. */
  readonly y: number;
};

export type AssetDescriptor = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /**
   * Empty string is legal and meaningful: it marks the image decorative, which
   * is correct for a placeholder sitting beside a text label that already names
   * the thing. It is never legal to *omit* alt.
   */
  readonly alt: string;
  readonly focal: FocalPoint;
  readonly slot: ImageSlotName;
  /**
   * True while this is generated placeholder art. Drives the `data-placeholder`
   * attribute the media wrapper stamps on the DOM, and the `assets:audit` list.
   */
  readonly isPlaceholder: boolean;
};

const CENTRE: FocalPoint = { x: 0.5, y: 0.5 };

/** Build a descriptor whose geometry is taken from the slot, never re-typed. */
function fromSlot(
  slot: ImageSlot,
  src: string,
  alt: string,
  options: { focal?: FocalPoint; isPlaceholder?: boolean } = {},
): AssetDescriptor {
  return {
    src,
    width: slot.intrinsic.width,
    height: slot.intrinsic.height,
    alt,
    focal: options.focal ?? CENTRE,
    slot: slot.name,
    isPlaceholder: options.isPlaceholder ?? true,
  };
}

/**
 * The registry.
 *
 * Brand marks live in `public/brand/` because they are genuinely code-adjacent —
 * the header cannot wait on a network fetch for the wordmark. **Everything else
 * that will eventually be a photograph is a placeholder here and a `media_asset`
 * reference later** (§J.4.6): real photography is uploaded through the admin, so
 * the firm's portraits never enter git and no code changes when they land.
 */
export const assets = {
  wordmark: fromSlot(imageSlots.wordmark, "/brand/wordmark.svg", "", {
    isPlaceholder: true,
  }),
  monogram: fromSlot(imageSlots.monogram, "/brand/monogram.svg", "", {
    isPlaceholder: true,
  }),

  heroLandscape: fromSlot(
    imageSlots["hero-landscape"],
    "/placeholders/hero-landscape.svg",
    "",
  ),
  heroPortrait: fromSlot(
    imageSlots["hero-portrait"],
    "/placeholders/hero-portrait.svg",
    "",
  ),

  /** Fallback portrait, used when a person has no `photo_asset_id` yet. */
  partnerPortrait: fromSlot(
    imageSlots["partner-portrait"],
    "/placeholders/partner-portrait.svg",
    "",
    // Heads sit in the upper third of a 4:5 portrait; centring crops the face.
    { focal: { x: 0.5, y: 0.34 } },
  ),

  officeExterior: fromSlot(
    imageSlots["office-exterior"],
    "/placeholders/office-exterior.svg",
    "",
  ),

  articleCover: fromSlot(
    imageSlots["article-cover"],
    "/placeholders/article-cover.svg",
    "",
  ),

  ogImage: fromSlot(imageSlots["og-image"], "/placeholders/og-image.svg", ""),
} as const satisfies Record<string, AssetDescriptor>;

export type AssetKey = keyof typeof assets;

/**
 * Override the alt text on a registry asset without copying its geometry.
 *
 * The fallback portrait is one file used for many people; the *label* differs
 * per person even though the art does not. This keeps the alt text at the call
 * site (where the person's name is known) while the path stays here.
 */
export function withAlt(asset: AssetDescriptor, alt: string): AssetDescriptor {
  return { ...asset, alt };
}

/**
 * Promote a CMS media reference to a descriptor, falling back to the registry
 * placeholder when the entity has no asset yet — the null-photo path from
 * §J.4.6, expressed once.
 */
export function assetOrPlaceholder(
  media:
    | { url: string; width: number; height: number; alt_text: string | null }
    | null
    | undefined,
  fallback: AssetDescriptor,
  alt: string,
): AssetDescriptor {
  if (!media) return withAlt(fallback, alt);
  return {
    src: media.url,
    width: media.width,
    height: media.height,
    alt: media.alt_text ?? alt,
    focal: CENTRE,
    slot: fallback.slot,
    isPlaceholder: false,
  };
}

/** `object-position` for a focal point. Consumed only by the media wrapper. */
export function focalToObjectPosition(focal: FocalPoint): string {
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n * 100)));
  return `${clamp(focal.x)}% ${clamp(focal.y)}%`;
}

/** Everything still on generated art. This is the handover checklist. */
export function unreplacedAssets(): { key: string; asset: AssetDescriptor }[] {
  return Object.entries(assets)
    .filter(([, asset]) => asset.isPlaceholder)
    .map(([key, asset]) => ({ key, asset }));
}
