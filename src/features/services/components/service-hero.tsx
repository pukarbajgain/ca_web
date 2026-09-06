import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { brand, isPresent, telHref } from "@/lib/brand";
import { routes } from "@/lib/routes";
import type { Breadcrumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

import { Breadcrumbs } from "./breadcrumbs";

import type { Service } from "../types";

/**
 * The `/services/[slug]` opening.
 *
 * The same deep ground as the index and the closing CTA band, so
 * the page opens and closes on one note. What it carries is deliberately short:
 * a breadcrumb (this is the site's only depth-3 page, and the trail is the
 * fastest route to a sibling service), the service name as the `h1`, its one
 * sentence, and **one** action.
 *
 * One action, not two. §D.6 row 2: two primary actions is the commonest way a
 * professional-services page loses a conversion, because the visitor has to
 * choose and so chooses neither.
 *
 * **The phone line renders only when a number is published** (CLAUDE.md §3.5).
 * With none, the single action stands alone, which is still a complete call to
 * action — the same rule and the same fallback the CTA band applies.
 */
export function ServiceHero({
  service,
  trail,
}: {
  service: Service;
  trail: readonly Breadcrumb[];
}) {
  const tel = telHref();

  return (
    <section
      aria-labelledby="service-hero-heading"
      /* Not pulled up under the header — see the note in `services-hero.tsx`. */
      className="relative isolate overflow-hidden bg-[var(--hero-ground)] text-[color:var(--hero-ink)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_85%_50%,var(--hero-ground-2),transparent_70%)]"
      />

      <Container className="py-10 md:py-14 lg:py-20">
        <Breadcrumbs trail={trail} tone="inverse" />

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-3 text-label-small text-[color:var(--hero-ink-subtle)] uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-70" />
              {vocabulary.nav.services}
            </p>

            <h1
              id="service-hero-heading"
              className="mt-8 max-w-[16ch] font-[family-name:var(--font-display)] text-display-medium text-balance"
            >
              {service.name}
            </h1>

            <p className="mt-8 max-w-[62ch] text-body-large text-[color:var(--hero-ink-muted)]">
              {service.summary}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4 lg:items-end lg:justify-end">
            <Link
              href={routes.contact()}
              className={cn(
                buttonVariants({ variant: "inverse", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              {vocabulary.actions.bookClosing}
            </Link>

            {tel && isPresent(brand.contact.phone) ? (
              <a
                href={tel}
                className="tabular text-body-medium text-[color:var(--hero-ink-muted)] transition-colors hover:text-[color:var(--hero-ink)]"
              >
                {vocabulary.actions.call} {brand.contact.phone}
              </a>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
