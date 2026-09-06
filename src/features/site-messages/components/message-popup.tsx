"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { browserStorages, isDismissed, recordDismissal } from "../dismissal";
import { TONE_RULE, TONE_WORD } from "../tone";

import type { SiteMessage } from "../service";

/**
 * The popup, rendered **only after hydration**.
 *
 * `active` starts null, so the server renders nothing and no popup markup ever
 * enters the ISR HTML (ARCHITECTURE.md §D.1). That is not a performance
 * micro-optimisation: the HTML is shared by every visitor of a path, and
 * dismissal is per-visitor, so a popup baked into it would be either shown to
 * someone who closed it or cached away from someone who had not.
 *
 * **A native `<dialog>`, not a hand-built overlay.** `showModal()` gives focus
 * containment, Escape, inertness of the page behind and the top layer — four
 * accessibility requirements that hand-rolled modals routinely get wrong, and
 * that no amount of extra JavaScript implements as well as the browser already
 * has.
 */
export function MessagePopup({ messages }: { messages: readonly SiteMessage[] }) {
  const [active, setActive] = useState<SiteMessage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  /** One popup per page view, whatever the triggers do afterwards. */
  const spent = useRef(false);

  useEffect(() => {
    if (spent.current || messages.length === 0) return;

    const storages = browserStorages();
    const candidate = messages.find(
      (message) => !isDismissed(message.key, Date.now(), storages),
    );
    if (!candidate) return;

    let cancelled = false;
    const open = () => {
      if (cancelled || spent.current) return;
      spent.current = true;
      setActive(candidate);
    };

    return armTrigger(candidate, open, () => {
      cancelled = true;
    });
  }, [messages]);

  useEffect(() => {
    if (active) dialogRef.current?.showModal();
  }, [active]);

  /**
   * Runs for every close — the button, Escape, and the backdrop click below.
   *
   * The dismissal is recorded here rather than in the button handler precisely
   * so that a visitor who presses Escape is treated as having seen it. Anything
   * else means the popup returns on the next page for the reader who most
   * clearly signalled they were done with it.
   */
  const handleClose = useCallback(() => {
    if (active)
      recordDismissal(active.key, active.frequency, Date.now(), browserStorages());
    setActive(null);
  }, [active]);

  if (!active) return null;

  const word = TONE_WORD[active.tone];

  return (
    /*
     * The two `jsx-a11y` rules below want a keyboard equivalent for the click
     * handler, and there is one: Escape, implemented by the browser for every
     * modal `<dialog>`, plus the close button in the header. Adding a key
     * handler would give the keyboard a second, worse route to the same action.
     * The "non-interactive element" half is the plugin's element list predating
     * `<dialog>`; a modal dialog is interactive by definition.
     */
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Escape and the close button are the keyboard path.
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      /* A click on the backdrop lands on the dialog element itself, never on a
         child — so this closes on the backdrop without a wrapper div and
         without swallowing clicks on the content. */
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-labelledby="site-message-popup-title"
      className="site-popup w-[min(32rem,calc(100vw-2rem))] bg-surface p-0 text-on-surface"
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <p
          className={`border-s-2 ps-3 text-label-medium text-on-surface-variant uppercase ${TONE_RULE[active.tone]}`}
        >
          {word ?? "Notice"}
        </p>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="-me-2 -mt-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current pointer-coarse:size-11"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {active.image ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           A CMS image is data, not a typed asset descriptor; see the same
           decision, argued in full, in `notice-band.tsx`. */
        <img
          src={active.image.url}
          alt={active.image.alt}
          width={active.image.width ?? undefined}
          height={active.image.height ?? undefined}
          decoding="async"
          style={{ objectPosition: active.image.objectPosition }}
          className="mt-5 aspect-[16/9] w-full object-cover"
        />
      ) : null}

      <div className="p-6">
        <h2
          id="site-message-popup-title"
          className="font-[family-name:var(--font-display)] text-headline-small"
        >
          {active.title}
        </h2>
        {active.body ? (
          <p className="mt-3 text-body-medium text-on-surface-variant">{active.body}</p>
        ) : null}
        {active.ctaHref ? (
          <Link
            href={active.ctaHref}
            onClick={() => dialogRef.current?.close()}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-label-large text-primary-foreground hover:bg-primary/90"
          >
            {active.ctaLabel ?? "Read more"}
          </Link>
        ) : null}
      </div>
    </dialog>
  );
}

/**
 * Arm the trigger the firm chose, and return the teardown.
 *
 * Kept out of the component so each trigger's cleanup sits next to the listener
 * it removes — the shape in which a leaked scroll listener is visible rather
 * than buried in a branch of a long effect.
 */
function armTrigger(
  message: SiteMessage,
  open: () => void,
  cancel: () => void,
): () => void {
  switch (message.trigger) {
    case "delay": {
      const timer = window.setTimeout(
        open,
        Math.max(0, message.triggerValue ?? 0) * 1000,
      );
      return () => {
        cancel();
        window.clearTimeout(timer);
      };
    }

    case "scroll": {
      const target = Math.min(100, Math.max(1, message.triggerValue ?? 50));
      const onScroll = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        // A page shorter than the viewport has no scroll depth to reach. Firing
        // immediately is right: the visitor has already seen all of it.
        const progress = scrollable <= 0 ? 100 : (window.scrollY / scrollable) * 100;
        if (progress >= target) open();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => {
        cancel();
        window.removeEventListener("scroll", onScroll);
      };
    }

    case "exit_intent": {
      /**
       * **There is no exit intent on a touch screen**, and most of this firm's
       * visitors are on one. Rather than let the admin's choice mean "never
       * shows on mobile" — a silent failure the editor could not diagnose — a
       * coarse pointer falls back to the nearest honest equivalent: show it
       * once the visitor has read enough to have engaged.
       */
      if (window.matchMedia("(pointer: coarse)").matches) {
        return armTrigger(
          { ...message, trigger: "scroll", triggerValue: 60 },
          open,
          cancel,
        );
      }
      const onOut = (event: MouseEvent) => {
        // `relatedTarget` null plus a y at or above the top edge is the pointer
        // leaving for the browser chrome, rather than crossing between elements.
        if (!event.relatedTarget && event.clientY <= 0) open();
      };
      document.addEventListener("mouseout", onOut);
      return () => {
        cancel();
        document.removeEventListener("mouseout", onOut);
      };
    }

    case "immediate":
    default: {
      open();
      return cancel;
    }
  }
}
