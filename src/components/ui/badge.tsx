import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-medium uppercase",
  {
    variants: {
      variant: {
        neutral: "bg-surface-container-high text-on-surface-variant",
        primary: "bg-primary-container text-on-primary-container",
        accent: "bg-tertiary-container text-on-tertiary-container",
        outline: "border border-outline-variant text-on-surface-variant",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
