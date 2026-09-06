import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { brand, isPresent, mailHref, telHref } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

/**
 * CTA band (§D.6 row 15): one clear invitation, **no pressure language**.
 *
 * "Limited slots", "book before the deadline" and countdown timers are wrong here
 * twice over — a poor fit for a regulated profession, and they read as
 * desperation to exactly the kind of client a practice wants. The invitation is a
 * first conversation with no obligation, which is also true.
 *
 * Reuses the site's deep ground so the page closes on
 * the same note, and the section reads as the answer to the question the hero
 * asked. Left-aligned rather than centred: the whole page is left-aligned, and a
 * centred block at the end reads as a different site's component.
 *
 * The phone link renders only when there is a number to call (CLAUDE.md §3.5),
 * and falls back to email; with neither published, the single "Book" action
 * stands alone, which is still a complete call to action.
 */
export function CtaBand() {
  const tel = telHref();
  const mail = mailHref();

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden bg-[var(--hero-ground)] text-[color:var(--hero-ink)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_85%_50%,var(--hero-ground-2),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--hero-rule)] to-transparent"
      />

      <Container className="py-16 md:py-24">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-label-small text-[color:var(--hero-ink-subtle)] uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-70" />
              {vocabulary.sections.contact}
            </p>

            <h2
              id="cta-heading"
              className="mt-6 max-w-[18ch] font-[family-name:var(--font-display)] text-display-small"
            >
              Start with a{" "}
              <span className="text-[color:var(--hero-accent)] italic">
                conversation.
              </span>
            </h2>

            <p className="mt-5 max-w-[56ch] text-body-large text-[color:var(--hero-ink-muted)]">
              Tell us what the entity is and what is due. We will say what the work
              involves and what it costs — and if it is not work for us, we will say that
              too.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
            <Link
              href={routes.contact()}
              className={cn(
                buttonVariants({ variant: "inverse", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              {vocabulary.actions.bookClosing}
            </Link>

            {tel ? (
              <a
                href={tel}
                className="tabular text-body-medium text-[color:var(--hero-ink-muted)] transition-colors hover:text-[color:var(--hero-ink)]"
              >
                {vocabulary.actions.call} {brand.contact.phone}
              </a>
            ) : mail ? (
              <a
                href={mail}
                className="text-body-medium break-all text-[color:var(--hero-ink-muted)] transition-colors hover:text-[color:var(--hero-ink)]"
              >
                {brand.contact.email}
              </a>
            ) : null}

            {isPresent(brand.icanRegistrationNumber) ? (
              <p className="tabular text-body-small text-[color:var(--hero-ink-subtle)]">
                {vocabulary.labels.icanRegistration} {brand.icanRegistrationNumber}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
