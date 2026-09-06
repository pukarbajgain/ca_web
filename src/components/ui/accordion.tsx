"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ComponentProps, ReactNode } from "react";

/**
 * Accordion, owned on top of `@base-ui/react`.
 *
 * Base UI supplies exactly the parts that are painful to get right and easy to
 * get wrong — the `aria-expanded`/`aria-controls` wiring, roving focus, and the
 * height transition driven by the `--accordion-panel-height` custom property.
 * The styling is ours, so this is not a dependency on someone else's design.
 *
 * Used for two very different jobs, which is why it lives in `ui/` rather than
 * inside the FAQ: the homepage FAQ, and the footer's phone layout where link
 * columns collapse into sections (§D.3 rule 6).
 */

export function Accordion({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Root>) {
  return (
    <BaseAccordion.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={cn("border-b border-outline-variant", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Trigger> & { children: ReactNode }) {
  return (
    <BaseAccordion.Header className="flex">
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-4 text-start",
          "text-title-medium text-on-surface transition-colors hover:text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "pointer-coarse:min-h-11",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-on-surface-variant transition-transform duration-200 group-data-[panel-open]:rotate-180"
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function AccordionPanel({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Panel> & { children: ReactNode }) {
  return (
    <BaseAccordion.Panel
      data-slot="accordion-panel"
      // Base UI measures the panel and exposes its height as a custom property;
      // animating that (rather than `height: auto`) is what makes the transition
      // actually run. The reduced-motion block in globals.css neutralises it.
      className={cn(
        "h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out",
        "data-[ending-style]:h-0 data-[starting-style]:h-0",
        className,
      )}
      {...props}
    >
      <div className={cn("pb-5 text-body-medium text-on-surface-variant")}>
        {children}
      </div>
    </BaseAccordion.Panel>
  );
}
