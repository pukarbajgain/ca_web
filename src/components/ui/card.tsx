import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

/**
 * Card surface.
 *
 * `@container` is on the root, not decoration: it lets everything inside adapt
 * to the *card's* width via the `cq-sm`/`cq-md`/`cq-lg` variants in globals.css.
 * That is what makes one card correct in a narrow sidebar and in a wide grid
 * cell on the same page — the difference between "responsive" and "adapted per
 * viewport" (ARCHITECTURE.md §D.3 rule 5).
 */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "@container flex h-full flex-col rounded-xl border border-outline-variant bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("font-[family-name:var(--font-display)] text-title-large", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-body"
      className={cn("flex flex-1 flex-col gap-3 p-5", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 p-5 pt-0", className)}
      {...props}
    />
  );
}
