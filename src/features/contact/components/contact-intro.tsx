import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand, isPresent } from "@/lib/brand";
import type { Office } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { ContactMethods } from "./contact-methods";

/**
 * The `/contact` page header, and the contact-method cards under it.
 *
 * ── Why this page does not open on the deep hero ground ─────────────────────
 * `/` and `/services` both open on the deep ledger ground, because both are
 * pages a visitor has to be persuaded by. `/contact` is a page a visitor has
 * already decided to use, and the fastest thing it can do is put the ways of
 * reaching us on screen without a full-height marketing panel first. That is a
 * designed difference per §D.3 rule 6, not an inconsistency — the `h1` and the
 * eyebrow are the same components the rest of the site uses.
 *
 * The ICAN registration number renders here when one exists, because "who am I
 * actually writing to" is a contact-page question. It is `null` today, so the
 * line does not render (CLAUDE.md §3.5).
 */
export function ContactIntro({ offices }: { offices: readonly Office[] }) {
  return (
    <Section labelledBy="contact-heading" index="01">
      <SectionHeading
        as="h1"
        id="contact-heading"
        eyebrow={vocabulary.sections.contact}
        title="Talk to the practice"
        lede="A first conversation costs nothing and carries no obligation. Tell us what the entity is and what is due, and we will tell you what the work involves — or that it is not work for us."
      />

      {isPresent(brand.icanRegistrationNumber) ? (
        <p className="tabular mt-6 text-body-medium text-on-surface-variant">
          {vocabulary.labels.icanRegistration} {brand.icanRegistrationNumber}
        </p>
      ) : null}

      {/* Renders nothing at all while no phone, WhatsApp, email or office is
          published — not a placeholder card, not a disabled button. */}
      <ContactMethods offices={offices} />
    </Section>
  );
}
