"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";

import { BrandLogo } from "@/components/media/brand-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { isActivePath, legalNav, primaryNav } from "@/config/nav";
import { brand, isPresent, mailHref, telHref } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

/**
 * The phone/tablet navigation drawer.
 *
 * Base UI's `Dialog` is doing the genuinely hard part: focus trapping, focus
 * restoration to the trigger on close, `Escape`, scroll locking, `aria-modal`
 * and `inert` on the rest of the document. The reference site hand-rolls all of
 * that (a manual Tab cycle over `querySelectorAll`) and ships two bugs with it —
 * a `tabIndex={-1}` close button, and links that stay focusable while the panel
 * is translated off-screen. Owning the *styling* is worth it; owning the focus
 * management is not.
 *
 * Right-side sheet rather than a full-screen overlay: the page stays partly
 * visible, so the drawer reads as a layer over the site rather than a
 * navigation event.
 */
export function MobileNav({ pathname }: { pathname: string }) {
  const tel = telHref();
  const mail = mailHref();

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label={vocabulary.nav.openMenu} />
        }
      >
        <Menu aria-hidden />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-[var(--md-scrim)]/40 backdrop-blur-[2px]",
            "transition-opacity duration-200",
            "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(88vw,22rem)] flex-col",
            "overflow-y-auto overscroll-contain border-l border-outline-variant bg-surface",
            "transition-transform duration-200 ease-[var(--ease-emphasized)]",
            "data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
            // Notched devices: the drawer runs edge to edge, so its own padding
            // has to clear the inset rather than relying on the page's.
            "pb-safe",
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-4">
            <Dialog.Title className="sr-only">{vocabulary.nav.primary}</Dialog.Title>
            <BrandLogo priority={false} className="h-9" />
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={vocabulary.nav.closeMenu}
                />
              }
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>

          <nav aria-label={vocabulary.nav.primary} className="p-4">
            <ul className="flex flex-col divide-y divide-outline-variant">
              {primaryNav.map((item, index) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Dialog.Close
                      render={<a href={item.href} />}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-baseline gap-4 py-3",
                        "text-title-large transition-colors",
                        active ? "text-primary" : "text-on-surface hover:text-primary",
                      )}
                    >
                      <span
                        aria-hidden
                        className="font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </Dialog.Close>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Contact block. Renders only what the firm has actually published —
              a drawer with a dead "Call us" row is worse than no row. */}
          {tel || mail ? (
            <div className="mt-auto border-t border-outline-variant p-4">
              <p className="text-label-small text-on-surface-variant uppercase">
                {vocabulary.actions.getInTouch}
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {tel ? (
                  <li>
                    <a
                      href={tel}
                      className="flex min-h-11 items-center text-body-medium text-on-surface hover:text-primary"
                    >
                      {brand.contact.phone}
                    </a>
                  </li>
                ) : null}
                {mail ? (
                  <li>
                    <a
                      href={mail}
                      className="flex min-h-11 items-center text-body-medium break-all text-on-surface hover:text-primary"
                    >
                      {brand.contact.email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="border-t border-outline-variant p-4">
            <Dialog.Close
              render={<a href={routes.contact()} />}
              className={buttonVariants({ variant: "primary", block: true })}
            >
              {vocabulary.actions.book}
            </Dialog.Close>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Dialog.Close
                    render={<a href={item.href} />}
                    className="text-body-small text-on-surface-variant hover:text-primary"
                  >
                    {item.label}
                  </Dialog.Close>
                </li>
              ))}
            </ul>
            {isPresent(brand.icanRegistrationNumber) ? (
              <p className="mt-3 text-body-small text-on-surface-variant">
                {vocabulary.labels.icanRegistration} {brand.icanRegistrationNumber}
              </p>
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
