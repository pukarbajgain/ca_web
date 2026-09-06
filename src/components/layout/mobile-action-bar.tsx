import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { mailHref, telHref, whatsAppHref } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

import type { ComponentType } from "react";

/**
 * Fixed bottom action bar — **below `md` only**.
 *
 * ARCHITECTURE.md §D.6 calls this the single highest-leverage conversion
 * element on a professional-services site on mobile, and both of the strongest
 * reference sites carry it. It is not a phone version of the header CTA; it is
 * the phone's answer to "I want to talk to someone now".
 *
 * Three things it has to get right, and each is a real bug if missed:
 *
 *  1. **It must never occlude content.** `<main>` carries a matching bottom
 *     padding (`app/(marketing)/layout.tsx`) built from the same `--action-bar-h`
 *     token declared here, so the two cannot drift. A fixed bar without that
 *     padding silently hides the last paragraph of every page.
 *  2. **`env(safe-area-inset-bottom)`**, or the bar sits under the iOS home
 *     indicator and the buttons stop being tappable. Requires
 *     `viewportFit: "cover"` in the root viewport export, which is set.
 *  3. **It renders only real channels.** A "Call" button with no number is a
 *     dead control on the most valuable pixels of the page. With no phone and no
 *     WhatsApp published, only "Book" (an internal route, always valid) remains,
 *     and the bar collapses to one full-width action.
 */

type Action = {
  key: string;
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  external: boolean;
  emphasis: boolean;
};

export function MobileActionBar() {
  const tel = telHref();
  const whatsapp = whatsAppHref();
  const mail = mailHref();

  const actions: Action[] = [];
  if (tel) {
    actions.push({
      key: "call",
      href: tel,
      label: vocabulary.actions.call,
      icon: Phone,
      external: false,
      emphasis: false,
    });
  }
  if (whatsapp) {
    actions.push({
      key: "whatsapp",
      href: whatsapp,
      label: vocabulary.actions.whatsapp,
      icon: MessageCircle,
      external: true,
      emphasis: false,
    });
  } else if (!tel && mail) {
    // With no telephony published at all, email is the only live channel; it
    // takes the slot rather than leaving a gap.
    actions.push({
      key: "email",
      href: mail,
      label: vocabulary.actions.email,
      icon: MessageCircle,
      external: false,
      emphasis: false,
    });
  }
  actions.push({
    key: "book",
    href: routes.contact(),
    label: vocabulary.actions.bookShort,
    icon: CalendarCheck,
    external: false,
    emphasis: true,
  });

  return (
    <div
      // Not `hidden md:hidden`: `md:hidden` alone is the mobile-first form —
      // present at base width, removed from `md` up (§D.3 rule 1).
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/95 backdrop-blur md:hidden"
      // `print:hidden` is applied below; a fixed bar prints on every page.
      role="group"
      aria-label={vocabulary.actions.getInTouch}
    >
      <ul className="flex items-stretch">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <Icon aria-hidden className="size-5" />
              <span className="text-label-medium">{action.label}</span>
            </>
          );
          const classes = cn(
            "flex min-h-14 w-full flex-col items-center justify-center gap-1",
            "transition-colors",
            action.emphasis
              ? "bg-primary text-primary-foreground"
              : "text-on-surface-variant hover:text-primary",
          );

          return (
            <li key={action.key} className="flex-1">
              {action.external ? (
                <a
                  href={action.href}
                  className={classes}
                  target="_blank"
                  // `noreferrer` as well as `noopener`: the target learns the
                  // referring URL otherwise, and a phone number in a query
                  // string would leak with it.
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              ) : action.href.startsWith("/") ? (
                <Link href={action.href} className={classes}>
                  {content}
                </Link>
              ) : (
                <a href={action.href} className={classes}>
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
