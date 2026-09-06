import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

/**
 * The section header: eyebrow rule + label, display heading, optional lede.
 *
 * Every section on the page uses this, which is the point — a marketing site
 * that hand-writes its headings ends up with six slightly different heading
 * treatments and no way to change them all at once.
 *
 * `id` is required rather than optional: the section that owns this heading
 * points `aria-labelledby` at it, so a screen-reader user navigating by region
 * hears "Services, region" instead of six anonymous regions.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  align = "start",
  tone = "default",
  as: Tag = "h2",
  className,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "start" | "center";
  /** `inverse` for sections on the deep ground (hero, CTA band). */
  tone?: "default" | "inverse";
  as?: "h1" | "h2";
  className?: string;
}) {
  const centred = align === "center";
  /* `inverse` means "on the hero's deep ground", which is fixed across both
   * colour schemes (site.css) — so it uses the hero ink tokens rather than
   * `primary-foreground`, which flips to a dark value in dark mode and would
   * become invisible there. The `color:` hint is mandatory — without it
   * Tailwind resolves the arbitrary value as a font size, not a colour
   * (see src/lib/tailwind-usage.test.ts). */
  const muted =
    tone === "inverse" ? "text-[color:var(--hero-ink-muted)]" : "text-on-surface-variant";
  const strong = tone === "inverse" ? "text-[color:var(--hero-ink)]" : "text-on-surface";

  return (
    <div
      className={cn(
        "flex flex-col",
        centred && "items-center text-center",
        // 60ch on the lede keeps the measure readable at every width; the
        // heading is allowed to run wider because display type reads faster.
        centred ? "mx-auto max-w-3xl" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className={cn("flex items-center gap-3 text-label-small uppercase", muted)}>
          {/* The rule is decorative; it must not be announced. */}
          <span aria-hidden className="h-px w-8 bg-current opacity-60" />
          {eyebrow}
        </p>
      ) : null}

      <Tag
        id={id}
        className={cn(
          "font-[family-name:var(--font-display)]",
          Tag === "h1" ? "text-display-medium" : "text-display-small",
          eyebrow ? "mt-4" : "",
          strong,
        )}
      >
        {title}
      </Tag>

      {lede ? (
        <p className={cn("mt-4 max-w-[60ch] text-body-large", muted)}>{lede}</p>
      ) : null}
    </div>
  );
}
