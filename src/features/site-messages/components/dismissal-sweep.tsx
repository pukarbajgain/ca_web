"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { browserStorages, isDismissed } from "../dismissal";

/**
 * Re-applies dismissal after a **client-side navigation**.
 *
 * The pre-paint script covers a document load and nothing else: on a soft
 * navigation React swaps in fresh markup from the RSC payload — without the
 * `hidden` attribute — and an inline `<script>` that arrives that way does not
 * run again. The measured symptom: close the announcement bar, click "Insights",
 * and it is back. On a site where almost every navigation is soft, that made the
 * close button look broken.
 *
 * A layout effect, not an effect: it runs synchronously after React commits the
 * new DOM and **before the browser paints**, so the message is hidden in the
 * same frame it was inserted. A plain `useEffect` would paint the bar and then
 * remove it — the flash and the layout shift the pre-paint script exists to
 * avoid, just moved to a different moment.
 *
 * It reads `isDismissed` directly, so this is not a third copy of the rule:
 * there are two implementations — this module's predicate and the ES5 script —
 * and `dismissal.test.ts` runs both against the same state and demands the same
 * answer.
 */

/**
 * `useLayoutEffect` warns when a component is rendered on the server, and every
 * client component here is. The effect has nothing to do during SSR — there is
 * no DOM to sweep — so the server sees the no-op variant.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function DismissalSweep() {
  const pathname = usePathname();

  useBeforePaint(() => {
    const storages = browserStorages();
    const now = Date.now();

    for (const element of document.querySelectorAll<HTMLElement>("[data-site-message]")) {
      const key = element.getAttribute("data-site-message");
      if (key && isDismissed(key, now, storages)) element.setAttribute("hidden", "");
    }
  }, [pathname]);

  return null;
}
