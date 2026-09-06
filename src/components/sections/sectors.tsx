import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { sectors } from "@/config/content";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Sectors served (§D.6 row 9).
 *
 * This section exists because of a constraint, and the constraint makes it
 * better: a CA firm may not publish a client list — confidentiality, and ICAN's
 * advertising restrictions (CLAUDE.md §3.5) — so relevant experience has to be
 * signalled without naming anyone. Naming the *sector* plus the specific issue
 * that sector brings ("seasonal revenue cycles and service-charge treatment" for
 * hospitality) communicates more competence than a logo wall would, and carries
 * no regulatory risk at all.
 *
 * Drawn as a ruled table rather than a card grid. A logo wall is what this
 * section replaces, and a row of cards is just a logo wall with the logos
 * removed; ruled rows say "this is a schedule", which is both more honest about
 * what the content is and more particular to the practice.
 *
 * A description list, because that is exactly what it is.
 */
export function Sectors() {
  if (sectors.length === 0) return null;

  return (
    <Section labelledBy="sectors-heading" ground="muted">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="sectors-heading"
            eyebrow={vocabulary.sections.sectors}
            title="Where we work most"
            lede="Sectors whose reporting and tax treatment we deal with regularly. We do not publish client names."
          />
        </div>

        <dl className="lg:col-span-8">
          {sectors.map((sector, index) => (
            <div
              key={sector.name}
              className="group grid gap-1 border-t border-outline-variant py-5 transition-colors last:border-b hover:border-primary/40 sm:grid-cols-[auto_1fr_1.2fr] sm:items-baseline sm:gap-6"
            >
              <span
                aria-hidden
                className="font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant opacity-80"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <dt className="text-title-medium text-on-surface transition-colors group-hover:text-primary">
                {sector.name}
              </dt>
              <dd className="text-body-medium text-on-surface-variant">{sector.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
