import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

/**
 * A horizontally-scrolling region.
 *
 * ARCHITECTURE.md §D.3 rule 2 says wide content — tables, diagrams, the
 * compliance calendar — scrolls inside its own container so the page never
 * scrolls sideways. That rule is only half of the requirement: **a scrollable
 * region that nothing inside it can take focus must itself be focusable**, or a
 * keyboard user cannot reach the content on the right, and a Safari user cannot
 * scroll it at all. axe reports this as `scrollable-region-focusable`, and it
 * caught two instances on `/design`.
 *
 * So this primitive pairs the `.scroll-x` utility with `tabIndex={0}` and a
 * required label. The label is required rather than optional because an
 * unlabelled focus stop is its own accessibility problem: the user tabs into
 * something and is told nothing about what it is.
 */
export function ScrollX({
  label,
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "tabIndex" | "role"> & { label: string }) {
  return (
    <div
      // `region` + a name means it is announced, and shows up in the rotor.
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("scroll-x", className)}
      {...props}
    >
      {children}
    </div>
  );
}
