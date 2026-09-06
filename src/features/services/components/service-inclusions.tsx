import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { vocabulary } from "@/lib/vocabulary";

import type { ServiceInclusion } from "../types";

/**
 * "What's included" — the sub-services, set as a **definition list**.
 *
 * ARCHITECTURE.md §A.5 found this section on every reference CA site, and the
 * reason is straightforward: "Taxation" tells a prospect nothing, while "VAT and
 * TDS registration, returns and reconciliation" tells them the firm has done it.
 * Each entry therefore carries a term and a sentence — a list of six bullets is
 * a claim, six explained items is evidence.
 *
 * ── Why a `<dl>`, and why it is set this way ───────────────────────────────
 * This genuinely is a set of terms and their definitions, so the markup says so
 * and a screen reader announces the pairing. Visually it is the classic
 * document setting: term in the left column, definition in the right, one
 * hairline per entry and nothing else. No cards, no numerals — the order of a
 * scope list encodes nothing, and a numeral that encodes nothing is decoration
 * (CLAUDE.md §3.8b).
 *
 * Authored at base width as a stacked list; the two-column pairing arrives at
 * `lg`, where there is measure for it.
 */
export function ServiceInclusions({
  inclusions,
}: {
  inclusions: readonly ServiceInclusion[];
}) {
  if (inclusions.length === 0) return null;

  return (
    <Section labelledBy="included-heading" ground="muted" index="02">
      <SectionHeading
        id="included-heading"
        eyebrow="Scope"
        title={vocabulary.labels.whatIsIncluded}
        lede="The work this practice area actually covers. Anything outside it is quoted separately, and we say so before it starts."
      />

      <dl className="mt-14 border-t border-outline-variant md:mt-20">
        {inclusions.map((inclusion) => (
          <div
            key={inclusion.title}
            className="grid gap-2 border-b border-outline-variant py-7 lg:grid-cols-12 lg:gap-16 lg:py-9"
          >
            <dt className="text-title-medium text-balance text-on-surface lg:col-span-4">
              {inclusion.title}
            </dt>
            <dd className="max-w-[64ch] text-body-large text-on-surface-variant lg:col-span-8">
              {inclusion.detail}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
