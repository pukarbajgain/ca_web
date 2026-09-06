import Image from "next/image";

import { assets } from "@/lib/assets";
import { brand } from "@/lib/brand";
import { imageSlots } from "@/lib/image-slots";
import { cn } from "@/lib/utils";

/**
 * The firm's logo.
 *
 * A second component beside `AssetImage` rather than a variant of it, because a
 * logo wants the opposite box. `AssetImage` fills its parent and reserves a
 * ratio — right for photography, wrong here: it would put a grey
 * `bg-surface-container` panel behind a transparent PNG and force every caller
 * to compute a width. A logo is sized by *height* and takes whatever width its
 * proportions give it, which is what `width`/`height` plus an `h-*` class does.
 *
 * It lives in `components/media/` because that is the only directory allowed to
 * import `next/image` (`no-restricted-imports` in eslint.config.mjs), and it
 * still takes its path from the registry, so no component names an image file
 * (ARCHITECTURE.md §J.4).
 *
 * `priority` is on by default: the logo is in the header of every page, above
 * the fold, and lazy-loading the one mark that identifies the site is the kind
 * of saving that costs more than it returns.
 */
export function BrandLogo({
  className,
  priority = true,
  decorative = false,
}: {
  /** Set the height; width follows from the intrinsic size. */
  className?: string;
  priority?: boolean;
  /** True where the firm's name is already adjacent as real text. */
  decorative?: boolean;
}) {
  const slot = imageSlots.logo;

  return (
    <Image
      src={assets.logo.src}
      alt={decorative ? "" : brand.name}
      role={decorative ? "presentation" : undefined}
      width={slot.intrinsic.width}
      height={slot.intrinsic.height}
      priority={priority}
      className={cn("w-auto object-contain", className)}
    />
  );
}
