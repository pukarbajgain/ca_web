import Link from "next/link";

import { Container } from "@/components/layout/container";

import { TONE_STRIP } from "../tone";

import { DismissButton } from "./dismiss-button";
import { DismissalScript } from "./dismissal-script";

import type { SiteMessage } from "../service";

/**
 * The strip above the header: the firm's shortest, most urgent register.
 *
 * **One line, and it is allowed to be coloured.** This is the only surface on
 * the site where a tone gets a full-width fill; everywhere else the tone is a
 * rule (see `tone.ts`). A strip is short-lived, it is unmistakably the site
 * speaking rather than the page, and a reader already knows what a coloured band
 * across the top of a page means.
 *
 * **Above the utility bar, not below it.** The utility bar is permanent
 * furniture — registration number, phone, email. A notice that outranks it in
 * urgency has to sit above it, or the reader's eye finds the phone number first
 * and the announcement never gets read.
 *
 * Several bars can be live at once (the firm ordered them in the admin), and all
 * of them render. Collapsing to one would silently drop something the firm
 * chose to publish, and finding out which by scrolling is not something an
 * editor should have to do.
 */
export function AnnouncementBar({ messages }: { messages: readonly SiteMessage[] }) {
  if (messages.length === 0) return null;

  return (
    <>
      <div className="print-hidden">
        {messages.map((message) => (
          <div
            key={message.key}
            data-site-message={message.key}
            /* The pre-paint script may add `hidden` to this element before
               React hydrates. That is an attribute mismatch by construction,
               and this scopes the warning to this element without silencing
               its children. */
            suppressHydrationWarning
            className={`${TONE_STRIP[message.tone]} border-b border-black/5`}
          >
            <Container className="flex min-h-9 items-center justify-center gap-3 py-1.5">
              {/* `text-center` rather than a left-aligned row: a single short
                  line centred in a strip reads as a notice, while the same line
                  pushed left reads as a stray label. */}
              <p className="min-w-0 text-center text-body-small">
                <span className="font-medium">{message.title}</span>
                {message.body ? (
                  <span className="ms-2 opacity-90">{message.body}</span>
                ) : null}
                {message.ctaHref ? (
                  <Link
                    href={message.ctaHref}
                    className="ms-2 inline-block font-medium underline underline-offset-2"
                  >
                    {message.ctaLabel ?? "Read more"}
                  </Link>
                ) : null}
              </p>
              {message.dismissible ? (
                <DismissButton
                  messageKey={message.key}
                  frequency={message.frequency}
                  label={`Dismiss: ${message.title}`}
                />
              ) : null}
            </Container>
          </div>
        ))}
      </div>
      {/* Immediately after the strips, so a dismissed one never paints. */}
      {messages.some((message) => message.dismissible) ? <DismissalScript /> : null}
    </>
  );
}
