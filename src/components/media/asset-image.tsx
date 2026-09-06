import Image from "next/image";

import { focalToObjectPosition, type AssetDescriptor } from "@/lib/assets";
import { imageSlots, slotAspect } from "@/lib/image-slots";
import { cn } from "@/lib/utils";

/**
 * The only component in the app allowed to import `next/image` (enforced by
 * `no-restricted-imports` in eslint.config.mjs).
 *
 * Four properties it exists to guarantee:
 *
 *  1. **`sizes` is required.** Not "recommended" — a required prop, so omitting
 *     it is a type error. Without it Next serves the largest candidate to a
 *     phone, and the mistake is invisible in development on a fast laptop.
 *  2. **It takes a descriptor, never a string.** No component can name an image
 *     path, so replacing the firm's art is one edit in `lib/assets.ts`
 *     (ARCHITECTURE.md §J.4.1).
 *  3. **The box comes from the slot, so CLS is zero by construction.** The
 *     aspect ratio is reserved before the image loads and cannot change when
 *     real art of a different pixel size replaces a placeholder.
 *  4. **`data-placeholder` is stamped automatically**, so `pnpm assets:audit`
 *     and a visual sweep of the rendered page agree with each other (§J.4.4).
 */
export function AssetImage({
  asset,
  sizes,
  className,
  imageClassName,
  priority = false,
  fit = "cover",
  rounded = true,
}: {
  asset: AssetDescriptor;
  /**
   * REQUIRED. Describe the rendered width at each breakpoint, e.g.
   * `"(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"`. It must match
   * the grid the caller actually uses — a wrong `sizes` is worse than none.
   */
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** LCP images only. More than one `priority` image means none of them is. */
  priority?: boolean;
  /** `contain` for marks and diagrams; `cover` for photography. */
  fit?: "cover" | "contain";
  rounded?: boolean;
}) {
  const slot = imageSlots[asset.slot];

  /**
   * SVG bypasses the optimizer. `dangerouslyAllowSVG` is off in next.config.ts
   * (it lets a proxied SVG run script in the image origin), and our generated
   * placeholders are ~1–3 KB, so optimizing them would cost more than it saves.
   */
  const isVector = asset.src.endsWith(".svg");

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-surface-container",
        rounded && "rounded-xl",
        className,
      )}
      // Inline because the ratio is data: a Tailwind class cannot be built from
      // a runtime value, and `aspect-[16/9]` would have to be hand-kept in sync
      // with the slot registry — exactly the drift this system removes.
      style={{ aspectRatio: slotAspect(slot) }}
      data-slot-name={slot.name}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isVector}
        // Empty alt means decorative; the `presentation` role stops assistive
        // tech from announcing the element at all rather than announcing it
        // with no name.
        role={asset.alt === "" ? "presentation" : undefined}
        data-placeholder={asset.isPlaceholder ? "" : undefined}
        className={cn(
          fit === "contain" ? "object-contain" : "object-cover",
          imageClassName,
        )}
        style={{ objectPosition: focalToObjectPosition(asset.focal) }}
      />
    </div>
  );
}
