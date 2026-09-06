import Link from "next/link";

import { Section } from "@/components/layout/section";
import { routes } from "@/lib/routes";

import { TeamPortrait } from "./team-portrait";

import type { TeamListRead, TeamMember } from "../service";

/**
 * The team directory: a ruled list, not a third card grid (CLAUDE.md §3.8b —
 * the homepage already carries one, `/services` and `/insights` deliberately
 * avoid a second and third).
 *
 * Post-nominals are the point of this page. FCA/ACA/CS/DISA are how a Nepali
 * reader judges a chartered accountancy practice's people in about two
 * seconds, so they are set as their own typographic element next to the name
 * — larger and more present than a designation line — rather than folded into
 * a parenthetical.
 */
function TeamRow({ member }: { member: TeamMember }) {
  return (
    <li>
      <Link
        href={routes.person(member.slug)}
        className="group grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-5 border-t border-outline-variant py-6 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6 sm:py-8"
      >
        <div className="w-16 shrink-0 sm:w-20">
          <TeamPortrait
            photo={member.photo}
            alt=""
            sizes="(min-width: 640px) 5rem, 4rem"
          />
        </div>

        <div className="min-w-0">
          <h3 className="flex flex-wrap items-baseline gap-x-2.5 font-[family-name:var(--font-display)] text-headline-small text-on-surface group-hover:underline">
            {member.name}
            {member.postNominals ? (
              <span className="text-title-medium text-tertiary">
                {member.postNominals}
              </span>
            ) : null}
          </h3>
          {member.designation ? (
            <p className="mt-1 text-body-medium text-on-surface-variant">
              {member.designation}
            </p>
          ) : null}
          {member.practiceAreas.length > 0 ? (
            <p className="mt-2 text-body-small text-on-surface-variant">
              {member.practiceAreas.join(" · ")}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function TeamIndex({ read }: { read: TeamListRead }) {
  /**
   * Three outcomes, kept distinct (CLAUDE.md §3.8c). "No one on the team yet"
   * when the API is down is a lie, and on the one page whose entire purpose is
   * proving named, qualified humans stand behind the practice, it is the
   * single worst place for that lie to appear.
   */
  if (read.status === "unavailable") {
    return (
      <Section labelledBy="team-heading" ground="surface">
        <h2 id="team-heading" className="sr-only">
          Our team
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          We could not load the team just now. Please try again in a moment.
          {read.reference ? (
            <span className="mt-2 block font-[family-name:var(--font-mono)] text-body-small">
              Reference {read.reference}
            </span>
          ) : null}
        </p>
      </Section>
    );
  }

  if (read.items.length === 0) {
    return (
      <Section labelledBy="team-heading" ground="surface">
        <h2 id="team-heading" className="sr-only">
          Our team
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          Team profiles are not published yet.
        </p>
      </Section>
    );
  }

  return (
    <Section labelledBy="team-heading" ground="surface" index="01">
      <h2 id="team-heading" className="sr-only">
        Our team
      </h2>
      <ul className="flex flex-col border-b border-outline-variant">
        {read.items.map((member) => (
          <TeamRow key={member.slug} member={member} />
        ))}
      </ul>
    </Section>
  );
}
