import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { TeamIndex } from "@/features/team/components/team-index";
import { getTeamMembers } from "@/features/team/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

import type { Metadata } from "next";

/**
 * `/team` — the practice's named, qualified people.
 *
 * ARCHITECTURE.md §D.6 row 10 calls a named-and-qualified people page "the
 * strongest single trust element on a CA site". The register is a ruled list
 * rather than a card grid for the same reason `/insights` is (CLAUDE.md
 * §3.8b): a third grid on the site would read as one template with the nouns
 * swapped, and a list is the honest shape here too — these are people of
 * varying seniority, not equally-weighted tiles.
 *
 * ISR with the `team` tag, so publishing a profile in the admin invalidates
 * this page through `/api/revalidate` rather than waiting out the window.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our team",
  description: `The partners and staff of ${brand.name}, and the qualifications behind them.`,
  alternates: { canonical: routes.team() },
};

export default async function TeamPage() {
  const read = await getTeamMembers({ pageSize: 50 });

  return (
    <>
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: "Our team", path: routes.team() },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-16 md:px-10 md:py-24">
          <p className="text-label-medium text-tertiary uppercase">Our team</p>
          <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
            The people who sign the work.
          </h1>
          <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
            Every engagement is led by a named partner, and every filing is checked by
            someone qualified to check it.
          </p>
        </div>
      </header>

      <TeamIndex read={read} />
      <CtaBand />
    </>
  );
}
