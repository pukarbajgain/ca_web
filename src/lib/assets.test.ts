import { describe, expect, it } from "vitest";

import {
  assets,
  assetOrPlaceholder,
  focalToObjectPosition,
  unreplacedAssets,
  withAlt,
} from "./assets";
import { imageSlots, slotAspect, slotRatio } from "./image-slots";

/**
 * These tests exist to protect the *structural* promise of §J.4: replacing an
 * asset must never move the layout. They fail loudly if someone types a size
 * into `assets.ts` by hand, or adds a slot whose declared pixels contradict its
 * declared ratio.
 */

describe("image slots", () => {
  it("declares intrinsic dimensions that match the declared ratio", () => {
    for (const slot of Object.values(imageSlots)) {
      // Vector slots have no meaningful intrinsic size — their box is set by
      // cap-height — so the ratio contract does not apply to them.
      if (slot.vector) continue;
      const declared = slotRatio(slot);
      const actual = slot.intrinsic.width / slot.intrinsic.height;
      // A whole-pixel intrinsic size cannot always hit an exact ratio (1200×630
      // is 1.9048, not 1.9047…), so the tolerance is one pixel's worth.
      expect(Math.abs(declared - actual)).toBeLessThan(0.005);
    }
  });

  it("keys every slot by its own name, so a lookup cannot return the wrong slot", () => {
    for (const [key, slot] of Object.entries(imageSlots)) {
      expect(slot.name).toBe(key);
    }
  });

  it("renders a CSS aspect-ratio value", () => {
    expect(slotAspect(imageSlots["partner-portrait"])).toBe("4 / 5");
    expect(slotAspect(imageSlots["article-cover"])).toBe("16 / 9");
  });
});

describe("asset registry", () => {
  it("derives every descriptor's geometry from its slot", () => {
    for (const asset of Object.values(assets)) {
      const slot = imageSlots[asset.slot];
      expect(asset.width).toBe(slot.intrinsic.width);
      expect(asset.height).toBe(slot.intrinsic.height);
    }
  });

  it("gives every asset a defined alt (empty means decorative, undefined is a bug)", () => {
    for (const asset of Object.values(assets)) {
      expect(typeof asset.alt).toBe("string");
    }
  });

  it("lists every placeholder in the audit", () => {
    const audited = unreplacedAssets().map((entry) => entry.key);
    const placeholders = Object.entries(assets)
      .filter(([, asset]) => asset.isPlaceholder)
      .map(([key]) => key);
    expect(audited.sort()).toEqual(placeholders.sort());
  });

  it("overrides alt without disturbing geometry or the placeholder flag", () => {
    const labelled = withAlt(assets.partnerPortrait, "Kiran Shrestha, partner");
    expect(labelled.alt).toBe("Kiran Shrestha, partner");
    expect(labelled.width).toBe(assets.partnerPortrait.width);
    expect(labelled.focal).toEqual(assets.partnerPortrait.focal);
    expect(labelled.isPlaceholder).toBe(true);
  });
});

describe("assetOrPlaceholder", () => {
  it("falls back to the placeholder when the entity has no media", () => {
    const result = assetOrPlaceholder(null, assets.partnerPortrait, "A partner");
    expect(result.src).toBe(assets.partnerPortrait.src);
    expect(result.alt).toBe("A partner");
    expect(result.isPlaceholder).toBe(true);
  });

  it("uses CMS media when present, and keeps the slot so the box does not move", () => {
    const result = assetOrPlaceholder(
      { url: "/media/ab/cd/abcdef.webp", width: 1200, height: 1500, alt_text: null },
      assets.partnerPortrait,
      "A partner",
    );
    expect(result.src).toBe("/media/ab/cd/abcdef.webp");
    expect(result.slot).toBe("partner-portrait");
    expect(result.isPlaceholder).toBe(false);
    // A null `alt_text` in the CMS must not produce a null alt attribute.
    expect(result.alt).toBe("A partner");
  });

  it("prefers the asset's own alt text over the caller's fallback", () => {
    const result = assetOrPlaceholder(
      {
        url: "/media/ab/cd/abcdef.webp",
        width: 1200,
        height: 1500,
        alt_text: "From the CMS",
      },
      assets.partnerPortrait,
      "Fallback",
    );
    expect(result.alt).toBe("From the CMS");
  });
});

describe("focalToObjectPosition", () => {
  it("converts a focal point to percentages", () => {
    expect(focalToObjectPosition({ x: 0.5, y: 0.34 })).toBe("50% 34%");
  });

  it("clamps out-of-range values rather than emitting invalid CSS", () => {
    expect(focalToObjectPosition({ x: -1, y: 2 })).toBe("0% 100%");
  });
});
