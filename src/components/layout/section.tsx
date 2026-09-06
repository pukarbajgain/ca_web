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
 *
 * `index` prints a monospaced section number. That is not decoration for its own
 * sake: a ruled, numbered sequence is the visual language of a ledger, which is
 * this practice's own material, and it gives the page a spine that a stack of
 * centred headings does not have.
 */
export function Section({
  id,
  labelledBy,
  ground = "surface",
  index,
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
  /** Two-digit section number, e.g. "02". Rendered in the left rail from `lg`. */
  index?: string;
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
      <Container className={containerClassName}>
        {index ? (
          /* Absolutely positioned so it never affects the content's measure, and
           * only from `xl` where there is genuine gutter to put it in. Below that
           * it would be either cramped or a fake indent.
           *
           * The opacity is 0.8, not the 0.45 this started at: an 11px numeral is
           * small text and gets no contrast exemption, and 0.45 measured 2.2:1
           * against the page ground. The axe gate caught it. */
          <span
            aria-hidden
            className="pointer-events-none absolute top-16 left-8 hidden font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant opacity-80 xl:block"
          >
            {index}
          </span>
        ) : null}
        {children}
      </Container>
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
