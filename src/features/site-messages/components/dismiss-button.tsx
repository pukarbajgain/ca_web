"use client";

import { X } from "lucide-react";

import { browserStorages, recordDismissal } from "../dismissal";

import type { MessageFrequency } from "../types";

/**
 * The close control on a server-rendered message.
 *
 * **It hides its message through the DOM, not through React state, and that is
 * deliberate.** The message is server-rendered so it is in the HTML for a
 * crawler and for a visitor with no JavaScript, and the pre-paint script has
 * already hidden it — outside React — for anyone who dismissed it earlier.
 * Visibility therefore is not React's to own here. Making it React's would mean
 * turning the whole bar into a client component that renders nothing until
 * hydration, which brings back the flash and the layout shift the pre-paint
 * script exists to prevent.
 *
 * So this button does the same thing the script does, in the same way: set
 * `hidden` on the nearest `[data-site-message]` ancestor. Two writers, one
 * mechanism, and `site.css` makes the attribute win over the utility classes.
 */
export function DismissButton({
  messageKey,
  frequency,
  label = "Dismiss this message",
}: {
  messageKey: string;
  frequency: MessageFrequency;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        recordDismissal(messageKey, frequency, Date.now(), browserStorages());
        event.currentTarget.closest("[data-site-message]")?.setAttribute("hidden", "");
      }}
      className="-me-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current pointer-coarse:size-11"
    >
      <X aria-hidden className="size-4" />
    </button>
  );
}
