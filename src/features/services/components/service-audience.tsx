import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";

import type { ServiceAudience } from "../types";

/**
 * "Who this is for".
 *
 * Written as **situations, not company sizes**. "Businesses with 20–200
 * employees" tells a reader nothing about whether to call; "Entities changing
 * auditor, where a first-year audit means opening balances have to be verified
 * rather than assumed" lets them recognise themselves in one line. Recognition
 * is the entire job of this section.
 *
 * ── Composition: whitespace, no rules, no boxes ────────────────────────────
 * The section above it is a ruled definition list and the one below is a ruled
 * list of deliverables. A third ruled block here would turn the page into one
 * long grid, so this one is set with **nothing but space and hierarchy** — four
 * short text blocks, a strong gap between them, the situation in the on-surface
 * ink and its note in the variant. Varying the composition per section is what
 * keeps a document from reading as a template (CLAUDE.md §3.8b), and the pause
 * in the middle of the page is what makes the two ruled sections either side
 * legible as separate things.
 */
export function ServiceAudienceSection({
  audiences,
}: {
  audiences: readonly ServiceAudience[];
}) {
  if (audiences.length === 0) return null;

  return (
    <Section labelledBy="who-heading">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading id="who-heading" eyebrow="Fit" title="Who this is for" />
        </div>

        <ul className="grid gap-10 sm:grid-cols-2 sm:gap-x-12 lg:col-span-8">
          {audiences.map((audience) => (
            <li key={audience.title}>
              <h3 className="text-title-large text-balance text-on-surface">
                {audience.title}
              </h3>
              <p className="mt-2 max-w-[46ch] text-body-large text-on-surface-variant">
                {audience.note}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
