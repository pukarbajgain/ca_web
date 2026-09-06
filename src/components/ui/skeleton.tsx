import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

/**
 * A loading placeholder. Always paired with a **shape-matched** fallback — the
 * skeleton must repeat the real component's grid, padding and aspect classes,
 * or the Suspense boundary trades a spinner for a layout shift, which is worse.
 *
 * `aria-hidden` because the skeleton has no content to announce; the
 * surrounding region carries `aria-busy` if the wait is long enough to matter.
 * `animate-pulse` is disabled globally by the reduced-motion block in
 * globals.css, so no JS check is needed here.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-container-high", className)}
      {...props}
    />
  );
}
