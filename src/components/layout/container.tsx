import { cn } from "@/lib/utils";

import type { ComponentProps, ElementType } from "react";

/**
 * The only horizontal layout primitive.
 *
 * Owns the page gutter and the max width, and nothing else — vertical rhythm is
 * the section's business and is passed through `className`. Centralising the
 * gutter is what makes "no horizontal page scroll, ever" (§D.3 rule 2) an
 * enforceable property instead of a hope: there is one place where the padding
 * could be wrong.
 *
 * `max-w-page` resolves to `--container-page` from globals.css, so page width is
 * a single token, not a number repeated in twelve files.
 */
export function Container<T extends ElementType = "div">({
  as,
  className,
  width = "page",
  ...props
}: { as?: T; width?: "page" | "prose" } & Omit<ComponentProps<"div">, "as">) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "page" ? "max-w-page" : "max-w-prose-measure",
        className,
      )}
      {...props}
    />
  );
}
