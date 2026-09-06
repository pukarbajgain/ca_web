import { cn } from "@/lib/utils";

import { Container } from "./container";

import type { ReactNode } from "react";

/**
 * The page-section primitive.
 *
 * Every section on the site is `<section aria-labelledby>` + a ground + vertical
 * rhythm + a `Container`. Writing that by hand six times produced six slightly
 * different paddings and no way to retune the page's rhythm in one place — so it
 * lives here instead.
 *
 * **`ground` is the rhythm knob.** A long marketing page reads as one
 * undifferentiated column unless the surface changes; alternating `surface` and
 * `muted` gives each section an edge without adding a single divider line, and
 * `deep` is reserved for the two bookends (hero and CTA band) so the page opens
 * and closes on the same note. Because several sections render nothing while the
 * firm's facts are unconfirmed, the alternation is applied at the *call site* in
 * `page.tsx` — the rhythm has to be right for what actually renders, not for the
 * full section list.
 */
export function Section({
  id,
  labelledBy,
  ground = "surface",
  size = "default",
  className,
  containerClassName,
  children,
}: {
  /** DOM id, for in-page anchors (`/#faq`). Optional. */
  id?: string;
  /** The heading id this region is named by. Required — an unnamed region is
   *  noise in a screen reader's landmark list. */
  labelledBy: string;
  ground?: "surface" | "muted" | "deep";
  size?: "default" | "compact";
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  const grounds = {
    surface: "bg-surface text-on-surface",
    muted: "bg-surface-container-low text-on-surface",
    deep: "bg-[var(--hero-ground)] text-[color:var(--hero-ink)]",
  } as const;

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative",
        grounds[ground],
        // `scroll-mt` clears the sticky header when an in-page anchor lands here.
        id && "scroll-mt-24",
        size === "compact" ? "py-12 md:py-16" : "py-16 md:py-24 lg:py-28",
        className,
      )}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/**
 * A hairline that reads as a ruled line rather than a border. Used between the
 * grounds where two same-coloured sections meet, and inside dense grids.
 */
export function Rule({ className }: { className?: string }) {
  return (
    <hr
      aria-hidden
      className={cn("border-0 border-t border-outline-variant", className)}
    />
  );
}
