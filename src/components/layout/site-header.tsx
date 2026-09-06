"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { BrandLogo } from "@/components/media/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { isActivePath, primaryNav } from "@/config/nav";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

/**
 * Site header.
 *
 * **Adapted per viewport, not shrunk** (§D.3 rule 6): below `lg` it is the logo
 * plus a hamburger; from `lg`, the full nav plus one filled CTA. There is no
 * intermediate state where a cramped nav fights the logo for space.
 *
 * The bar is taller than the 64/80px a text wordmark needed, because the firm's
 * logo is a *stacked* lockup — mark over name over discipline. Rendered at the
 * height a horizontal wordmark would take, its name line falls to about seven
 * pixels and stops being readable, which is not a logo, it is a smudge. 80/96px
 * gives it 48/64px of height and the name back.
 *
 * Exactly one filled CTA (§D.6 row 2). Two primary actions is the most common
 * way a professional-services header loses conversions — the visitor has to
 * choose, so they choose neither.
 *
 * ── It compresses on scroll ─────────────────────────────────────────────────
 * Past 24px the bar tightens from 80/96px to 64/72px, the logo shrinks with it,
 * and a shadow appears. The point is not the animation: a sticky masthead that
 * keeps its full landing-page height costs a phone reader a fifth of the screen
 * on every page they scroll, and this gives most of it back while keeping the
 * nav within reach.
 *
 * `useSyncExternalStore`, not `useState` + a scroll effect. It gives React a
 * *different* value for the server snapshot (`false`) than for the client, so
 * the first client render matches the server and there is no hydration
 * mismatch — and it never calls `setState` inside an effect body, which the
 * React Compiler lint rule rejects as a cascading render. The listener is
 * `passive`, so it can never delay a scroll.
 *
 * ── It compresses on scroll ─────────────────────────────────────────────────
 * Past 24px the bar tightens from 80/96px to 64/72px, the logo shrinks with it
 * and a shadow lifts it off the page. The point is not the animation: a sticky
 * masthead that keeps its full landing-page height costs a phone reader a fifth
 * of the screen on every page they scroll, and this gives most of it back while
 * keeping the navigation within reach.
 *
 * ── It no longer has a transparent state, and that is a simplification ──────
 * The header used to render transparent over the top of the landing page,
 * because the hero was a deep typographic ground and a light bar above it read
 * as a hard seam. It also had to flip to solid on scroll, which meant a scroll
 * listener, a hydration-safe store to back it, and a light-ink palette on six
 * descendants that only ever applied on one route.
 *
 * The hero is now photographic and bright, so the header meets a light ground
 * everywhere. All of that machinery is gone: one appearance, on every page, at
 * every scroll position. The layout no longer needs the hero to pull itself up
 * underneath it either, which is what let the site-message band move back to
 * where it reads best — directly below the masthead.
 */
/**
 * True once the page has scrolled past the threshold.
 *
 * `useSyncExternalStore`, not `useState` + a scroll effect: it gives React a
 * *different* value for the server snapshot (`false`) than for the client, so
 * the first client render matches the server and there is no hydration
 * mismatch — and it never calls `setState` inside an effect body, which the
 * React Compiler lint rule rejects as a cascading render. `passive`, so the
 * listener can never delay a scroll.
 */
function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function useHasScrolled(threshold = 24): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const compact = useHasScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-outline-variant bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85",
        "transition-shadow duration-300",
        compact && "shadow-[0_1px_16px_-6px_rgb(6_35_64/0.28)]",
      )}
    >
      <Container
        className={cn(
          "flex items-center justify-between gap-4",
          "transition-[height] duration-300 ease-out motion-reduce:transition-none",
          compact ? "h-16 lg:h-[4.5rem]" : "h-20 lg:h-24",
        )}
      >
        <Link
          href={routes.home()}
          aria-label={`${brand.name} — ${vocabulary.nav.home}`}
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {/* The logo carries the firm's name as artwork, and the link already
              carries it as an accessible name — so the image itself is
              decorative and must not be announced twice. */}
          <BrandLogo
            decorative
            className={cn(
              "transition-[height] duration-300 ease-out motion-reduce:transition-none",
              compact ? "h-9 lg:h-11" : "h-12 lg:h-16",
            )}
          />
        </Link>

        <nav aria-label={vocabulary.nav.primary} className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "link-underline text-label-large transition-colors",
                      active
                        ? "text-primary"
                        : "text-on-surface-variant hover:text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={routes.contact()}
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "hidden lg:inline-flex",
            )}
          >
            {vocabulary.actions.book}
          </Link>
          <div className="lg:hidden">
            <MobileNav pathname={pathname} />
          </div>
        </div>
      </Container>
    </header>
  );
}
