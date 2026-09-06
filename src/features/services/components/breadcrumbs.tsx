import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Breadcrumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * The visible breadcrumb trail.
 *
 * Paired with `breadcrumbJsonLd()` at the page level rather than emitting its
 * own script: the structured trail and the visible trail are built from the
 * **same array**, so a crawler can never be shown a hierarchy the reader is not.
 *
 * The last crumb is the current page and is deliberately **not a link** —
 * `aria-current="page"` says so, and a link to the page you are on is a control
 * that does nothing.
 *
 * `tone="inverse"` for the deep hero ground; the tokens match `SectionHeading`'s
 * inverse branch so the two never disagree about what "muted on deep" means.
 */
export function Breadcrumbs({
  trail,
  tone = "default",
  className,
}: {
  trail: readonly Breadcrumb[];
  tone?: "default" | "inverse";
  className?: string;
}) {
  if (trail.length < 2) return null;

  const muted =
    tone === "inverse" ? "text-[color:var(--hero-ink-muted)]" : "text-on-surface-variant";
  const current = tone === "inverse" ? "text-[color:var(--hero-ink)]" : "text-on-surface";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-x-1 gap-y-1", muted)}>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden className="size-3.5 shrink-0 opacity-70" />
              ) : null}
              {isLast ? (
                <span aria-current="page" className={cn("text-label-large", current)}>
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="inline-flex items-center text-label-large underline-offset-4 hover:underline pointer-coarse:min-h-11"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
