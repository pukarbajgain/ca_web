"use client";

import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ComponentProps, ReactNode } from "react";

/**
 * Form field primitives, local to the contact feature.
 *
 * ── Why these live here and not in `components/ui/` ─────────────────────────
 * `components/ui/` holds the primitives the *site* uses, and today the site has
 * exactly one form. Promoting an input to the design system before a second
 * consumer exists is how a design system acquires a variant nobody needs.
 * When the second form arrives (article search, careers application) these move
 * up unchanged — the props are already the shadcn shape.
 *
 * ── What they get right, which a bare `<input>` does not ────────────────────
 *  - **The label is a real `<label htmlFor>`**, never a placeholder. A
 *    placeholder disappears the moment someone types, and a form whose labels
 *    vanish is unusable for anyone who is interrupted mid-fill.
 *  - **`aria-invalid` + `aria-describedby`** wire the message to the control, so
 *    a screen reader announces the error when focus lands rather than leaving it
 *    as red text somebody has to find.
 *  - **`pointer-coarse:min-h-11`** — the 44px touch floor from §D.3 rule 4,
 *    applied to coarse pointers only so desktop density is unaffected.
 *  - Optional fields say **"Optional"** rather than marking the required ones
 *    with an asterisk. Most of this form is required; marking the exceptions is
 *    less visual noise and needs no legend.
 */

const CONTROL = [
  "w-full rounded-md border bg-surface px-3 py-2.5",
  "text-body-medium text-on-surface",
  "placeholder:text-on-surface-variant/70",
  "transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "pointer-coarse:min-h-11",
].join(" ");

function borderFor(invalid: boolean) {
  return invalid
    ? "border-destructive focus-visible:outline-destructive"
    : "border-outline hover:border-on-surface-variant";
}

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-label-large text-on-surface"
      >
        {label}
        {hint ? (
          <span className="text-label-medium font-normal text-on-surface-variant">
            {hint}
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-body-small text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, borderFor(Boolean(error)), className)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, "min-h-36 resize-y", borderFor(Boolean(error)), className)}
        {...props}
      />
    </FieldShell>
  );
}

/**
 * A **native** `<select>`, not a custom listbox.
 *
 * On a phone a native select opens the platform picker — a full-height wheel on
 * iOS, a full-screen list on Android — which is both faster to use and more
 * accessible than anything a component library renders into a popover. The only
 * thing it costs is control over the closed-state chevron, which is drawn here.
 */
export function SelectField({
  id,
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            CONTROL,
            "appearance-none pr-10",
            borderFor(Boolean(error)),
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
    </FieldShell>
  );
}

/**
 * The consent checkbox.
 *
 * The native input stays in the DOM and keeps every keyboard and AT behaviour;
 * it is made transparent and stretched over the drawn box (`peer` + an absolute
 * overlay) rather than replaced, so `:checked`, `:focus-visible` and form
 * submission all still work. `sr-only` alone would break the click target.
 */
export function CheckboxField({
  id,
  label,
  error,
  ...props
}: ComponentProps<"input"> & { id: string; label: ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-start gap-3">
        <input
          type="checkbox"
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="peer absolute size-5 cursor-pointer opacity-0"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
            "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
            /* The tick is a *descendant* of this span, and `peer-*` compiles to
             * a sibling combinator — `peer-checked:opacity-100` on the <svg>
             * itself would never match. Targeting it from the sibling span is
             * the form that actually works. */
            "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
            error ? "border-destructive" : "border-outline",
          )}
        >
          <Check aria-hidden className="size-3.5 transition-opacity" />
        </span>
        <label
          htmlFor={id}
          className="cursor-pointer text-body-medium text-on-surface-variant"
        >
          {label}
        </label>
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-body-small text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
