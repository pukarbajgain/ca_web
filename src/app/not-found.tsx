import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { primaryNav } from "@/config/nav";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * 404.
 *
 * Renders full site chrome deliberately. A 404 on a marketing site is usually a
 * stale inbound link — often from a search result — and a bare "not found" page
 * with no navigation converts a recoverable visit into a bounce. The nav list
 * below is the recovery path.
 *
 * The root `not-found.tsx` sits outside both route groups, so it carries its own
 * header and footer rather than inheriting a group layout.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        <Container className="py-16 md:py-24">
          <p className="font-[family-name:var(--font-mono)] text-label-medium text-on-surface-variant uppercase">
            404
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-display-small">
            {vocabulary.states.notFound}
          </h1>
          <p className="mt-4 max-w-[60ch] text-body-large text-on-surface-variant">
            {vocabulary.states.notFoundBody}
          </p>

          <ul className="mt-8 flex flex-col gap-2">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-title-medium text-primary hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href={routes.home()} className={`${buttonVariants()} mt-8`}>
            {vocabulary.actions.backHome}
          </Link>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
