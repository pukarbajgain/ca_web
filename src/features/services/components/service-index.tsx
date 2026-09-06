import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

import type { Service } from "../types";

/**
 * The `/services` index — an **editorial register**, not a card grid.
 *
 * ── Why not cards ──────────────────────────────────────────────────────────
 * The landing page already has a card grid of these six services. Repeating it
 * here would make "View all services" a link to the same information in a
 * different rectangle, and three consecutive card grids across two pages is the
 * single most template-like thing a site can do (CLAUDE.md §3.8b). Border, fill,
 * radius and shadow each say "separate object"; a practice's six standing
 * capabilities are not six objects, they are the contents of one file.
 *
 * So each service is a row on a hairline, and the only devices are a rule and
 * whitespace. No icon — an icon on every heading is decoration that says
 * nothing about the content. No numeral — the order of a service list encodes
 * nothing true, unlike the engagement steps, where the numbering *is* the
 * content. §3.8b: structural devices must encode something, never decorate.
 *
 * ── The composition ────────────────────────────────────────────────────────
 * A two-column pairing: the name on the left in display type, and on the right
 * what it actually covers — the summary at a generous measure, then the complete
 * sub-service list as quiet lines. That is the shape of a well-set contents
 * page, which is what this is.
 *
 * Authored at base width (§D.3 rule 1): everything stacks in one column, and the
 * two-column pairing appears at `lg` where the measure supports it. Row padding
 * grows with the viewport, because a wide screen with tight rows reads as a
 * spreadsheet.
 */
export function ServiceIndex({ services }: { services: readonly Service[] }) {
  if (services.length === 0) return null;

  return (
    <Section labelledBy="service-index-heading" ground="muted">
      <SectionHeading
        id="service-index-heading"
        eyebrow={vocabulary.sections.services}
        title="What we do, in full"
        lede="Each practice area is a standing capability with named people behind it. Open one for who it suits, what you receive and the questions we are asked about it."
      />

      <ul className="mt-14 border-t border-outline-variant md:mt-20">
        {services.map((service) => (
          <li key={service.slug} id={service.slug} className="scroll-mt-24">
            <div className="grid gap-6 border-b border-outline-variant py-10 lg:grid-cols-12 lg:gap-16 lg:py-14">
              <h3 className="font-[family-name:var(--font-display)] text-headline-medium text-balance text-on-surface lg:col-span-5">
                <Link
                  href={routes.service(service.slug)}
                  className="underline-offset-8 transition-colors hover:text-primary hover:underline"
                >
                  {service.name}
                </Link>
              </h3>

              <div className="lg:col-span-7">
                <p className="max-w-[62ch] text-body-large text-on-surface-variant">
                  {service.summary}
                </p>

                {service.whatsIncluded.length > 0 ? (
                  <ul className="mt-8 grid gap-x-10 gap-y-2 sm:grid-cols-2">
                    {service.whatsIncluded.map((inclusion) => (
                      <li
                        key={inclusion.title}
                        className="text-body-medium text-on-surface-variant"
                      >
                        {inclusion.title}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Link
                  href={routes.service(service.slug)}
                  className="mt-8 inline-flex min-h-11 items-center text-label-large text-primary underline-offset-4 hover:underline"
                >
                  {/* The accessible name carries the service, so a screen-reader
                      user listing links hears six distinct destinations rather
                      than six identical "Read more" entries. */}
                  <span aria-hidden>Read more</span>
                  <span className="sr-only">Read more about {service.name}</span>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
