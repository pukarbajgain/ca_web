"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Wordmark } from "@/components/brand/wordmark";
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
 * **Adapted per viewport, not shrunk** (§D.3 rule 6): below `lg` it is wordmark
 * plus hamburger; from `lg`, the full nav plus one filled CTA. There is no
 * intermediate state where a cramped nav fights the logo for space.
 *
 * Exactly one filled CTA (§D.6 row 2). Two primary actions is the most common way
 * a professional-services header loses conversions — the visitor has to choose,
 * so they choose neither.
 *
 * ── The transparent state ───────────────────────────────────────────────────
 * On the homepage, at the very top of the page, the header renders transparent
 * over the hero's deep ground and the hero is pulled up underneath it. Without
 * that, a light bar sits directly above a dark hero and the page opens on a hard
 * horizontal seam — the single most noticeable flaw in the first draft of this
 * design. It flips to the solid, blurred surface as soon as the page scrolls, so
 * content never runs under an unreadable nav.
 *
 * It is scoped to the homepage because it is the only route whose first section
 * is dark; on every other page the header already meets a light ground.
 */

/**
 * True once the page has scrolled past the threshold.
 *
 * `useSyncExternalStore` rather than `useState` + a scroll effect: it gives React
 * a *different* value for the server snapshot (`false`) than for the client, so
 * the first client render matches the server and there is no hydration mismatch —
 * and it does not call `setState` inside an effect body, which the React Compiler
 * lint rule rejects as a cascading render.
 */
function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function useHasScrolled(threshold = 8): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useHasScrolled();

  /* The preview route renders the landing page for `/design`'s viewport
   * switcher, so it gets the homepage treatment too — otherwise the review
   * surface shows a header the real page never renders. */
  const overDeepGround =
    pathname === routes.home() || pathname === routes.designPreview();
  const transparent = overDeepGround && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-colors duration-300",
        transparent
          ? "border-b border-transparent bg-transparent text-[color:var(--hero-ink)]"
          : // /85 behind a blur, not /75: at /75 the deep CTA band scrolling
            // underneath showed through legibly enough to compete with the labels.
            "border-b border-outline-variant bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link
          href={routes.home()}
          aria-label={`${brand.name} — ${vocabulary.nav.home}`}
          className={cn(
            "shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
            transparent ? "text-[color:var(--hero-ink)]" : "text-primary",
          )}
        >
          <Wordmark className="h-8 w-auto lg:h-9" />
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
                      "text-label-large transition-colors",
                      transparent
                        ? active
                          ? "text-[color:var(--hero-accent)]"
                          : "text-[color:var(--hero-ink-muted)] hover:text-[color:var(--hero-ink)]"
                        : active
                          ? "text-primary"
                          : "text-on-surface-variant hover:text-on-surface",
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
              buttonVariants({
                variant: transparent ? "inverse" : "primary",
                size: "md",
              }),
              "hidden lg:inline-flex",
            )}
          >
            {vocabulary.actions.book}
          </Link>
          <div className={cn("lg:hidden", transparent && "text-[color:var(--hero-ink)]")}>
            <MobileNav pathname={pathname} />
          </div>
        </div>
      </Container>
    </header>
  );
}
