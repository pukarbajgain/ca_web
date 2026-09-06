import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { AssetImage } from "@/components/media/asset-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { assets, withAlt } from "@/lib/assets";
import { brand, type Person } from "@/lib/brand";
import { slugify } from "@/lib/format";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Partners and senior staff (§D.6 row 10) — "the strongest single trust element
 * on a CA site. Named, qualified humans."
 *
 * And therefore the section with the strictest honesty rule: **there is no
 * placeholder person.** A placeholder photograph is fine — that is what
 * `assets.partnerPortrait` is for, and a real portrait replaces it with no
 * layout change because the 4:5 slot owns the box. A placeholder *name* would
 * be inventing a chartered accountant, which is categorically different. So
 * `brand.people` ships empty and this section renders nothing.
 *
 * Layout (§D.3 rule 6): a list with avatar on phone, a card grid from `sm`.
 * The phone form is a genuinely different layout, not a narrower grid — at
 * 390px a 4:5 portrait in a grid cell is either tiny or 500px tall.
 */
export function PeopleRail({ people = brand.people }: { people?: readonly Person[] }) {
  if (people.length === 0) return null;

  return (
    <Section labelledBy="people-heading" ground="muted">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          id="people-heading"
          eyebrow={vocabulary.sections.people}
          title="The people who do the work"
          lede="Engagements are led by a partner, and the partner named here is the one you deal with."
        />
        <Link
          href={routes.team()}
          className="group inline-flex min-h-11 items-center gap-2 text-label-large text-primary"
        >
          {vocabulary.actions.meetTheTeam}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
          />
        </Link>
      </div>

      <ul className="mt-12 flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {people.map((person) => (
          <li
            key={person.id}
            className="rise flex items-center gap-4 sm:flex-col sm:items-stretch sm:gap-0"
          >
            <div className="w-20 shrink-0 sm:w-full">
              <AssetImage
                asset={withAlt(assets.partnerPortrait, `${person.name}, ${person.role}`)}
                // Matches the layout exactly: 80px fixed on phone, then a
                // 2-up grid, then 4-up. A wrong `sizes` ships a 1200px image
                // to an 80px box.
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 80px"
              />
            </div>

            <div className="min-w-0 sm:mt-4">
              <h3 className="font-[family-name:var(--font-display)] text-title-large text-on-surface">
                <Link
                  href={routes.person(slugify(person.name))}
                  className="hover:text-primary"
                >
                  {person.name}
                </Link>
                {person.postNominals ? (
                  <span className="ml-2 text-title-small text-on-surface-variant">
                    {person.postNominals}
                  </span>
                ) : null}
              </h3>
              <p className="text-body-small text-on-surface-variant">{person.role}</p>
              {person.practiceAreas.length > 0 ? (
                <p className="mt-1 text-body-small text-on-surface-variant">
                  {person.practiceAreas.join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
