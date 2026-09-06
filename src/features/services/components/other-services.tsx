import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

import type { ServiceSummary } from "../types";

/**
 * "Other services" cross-links.
 *
 * Present on every reference CA service page (§A.5), and it earns its place for
 * a specific reason: a prospect who lands on the wrong service from a search
 * result is one click from the right one instead of one click from leaving. The
 * current service is excluded upstream by `listOtherServices` — a "see also"
 * list containing the page you are on is a dead link dressed as a suggestion.
 *
 * ── Deliberately the quietest thing on the page ────────────────────────────
 * This started as a grid of five cards with an icon and a hover arrow each. That
 * is a navigation aid competing with the page's own content, and it made the
 * foot of every service page busier than its body. It is now a ruled list of
 * names with one line of context: no icons, no borders, no fill. The visitor who
 * needs it will find it, and the visitor who does not is not made to look at it.
 */
export function OtherServices({ services }: { services: readonly ServiceSummary[] }) {
  if (services.length === 0) return null;

  return (
    <Section labelledBy="other-services-heading" size="compact">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          id="other-services-heading"
          eyebrow="Elsewhere in the practice"
          title="Other services"
        />
        <Link
          href={routes.services()}
          className="inline-flex min-h-11 items-center text-label-large text-primary underline-offset-4 hover:underline"
        >
          {vocabulary.actions.viewAllServices}
        </Link>
      </div>

      <ul className="mt-10 border-t border-outline-variant">
        {services.map((service) => (
          <li key={service.slug}>
            <Link
              href={routes.service(service.slug)}
              className="group grid gap-1 border-b border-outline-variant py-5 md:grid-cols-12 md:items-baseline md:gap-8"
            >
              <span className="text-title-medium text-on-surface transition-colors group-hover:text-primary md:col-span-4">
                {service.name}
              </span>
              <span className="max-w-[62ch] text-body-medium text-on-surface-variant md:col-span-8">
                {service.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
