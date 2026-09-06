import { AssetImage } from "@/components/media/asset-image";
import { assetOrPlaceholder, assets, withAlt } from "@/lib/assets";

import type { TeamPhoto } from "../service";

/**
 * A person's portrait, or the site's generic placeholder.
 *
 * Reuses the `partner-portrait` slot (4:5, "head and shoulders, plain ground")
 * that `PeopleRail` already established for the homepage, so a real photograph
 * uploaded through the admin renders identically wherever a person appears —
 * one slot, one crop discipline.
 *
 * `assetOrPlaceholder` wants `width`/`height` as plain numbers; the wire can
 * technically send either as `null` (the shared asset projection is optional
 * on both, same as an article cover). Treated the same way `brand.ts` treats a
 * half-known coordinate pair: both or neither, never a guess.
 */
export function TeamPortrait({
  photo,
  alt,
  sizes,
  priority = false,
}: {
  photo: TeamPhoto | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const descriptor =
    photo && photo.width !== null && photo.height !== null
      ? assetOrPlaceholder(
          {
            url: photo.url,
            width: photo.width,
            height: photo.height,
            alt_text: photo.altText,
          },
          assets.partnerPortrait,
          alt,
        )
      : withAlt(assets.partnerPortrait, alt);

  return <AssetImage asset={descriptor} sizes={sizes} priority={priority} />;
}
