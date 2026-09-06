import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

/**
 * The button vocabulary.
 *
 * Exported as `buttonVariants` as well as a component, because roughly half the
 * "buttons" on a marketing site are navigation and must be a real `<a>` for
 * middle-click, copy-link and crawlability. The reference marketing site solves
 * that by hand-writing a 300-character class string at every CTA; one exported
 * variant function is the same thing, once.
 *
 * **Touch floors.** `pointer-coarse:min-h-11` puts a 44px floor on every control
 * for coarse pointers only, so a phone gets the WCAG target size without
 * inflating desktop density (ARCHITECTURE.md §D.3 rule 4). It is on the base
 * variant rather than per-size deliberately: a `sm` button on a phone is still
 * a thumb target.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    "whitespace-nowrap transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "pointer-coarse:min-h-11",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** The single primary action. §D.6 row 2: never two competing ones. */
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        /** Tonal. Sits beside the primary without competing with it. */
        tonal:
          "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
        outline:
          "border border-outline bg-transparent text-foreground hover:bg-surface-container",
        ghost: "bg-transparent text-foreground hover:bg-surface-container",
        /** On a deep ground (the hero, the CTA band). */
        inverse: "bg-surface text-foreground hover:bg-surface-container-low",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-label-large",
        md: "h-11 px-5 text-label-large",
        lg: "h-12 px-6 text-body-medium",
        /** Square, for a hamburger or a single icon. */
        icon: "size-11 p-0",
      },
      /** Phone CTAs are usually full-width; desktop ones never are. */
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, block, type, ...props }: ButtonProps) {
  return (
    <button
      // Inside a <form> an untyped button submits. Defaulting to "button" makes
      // the accidental-submit bug unreachable rather than merely rare.
      type={type ?? "button"}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}
