import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand, isPresent, mailHref, telHref } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { contactMessages } from "../messages";

import { EnquiryForm, type ContactFallback } from "./enquiry-form";

/**
 * The enquiry form, in its section.
 *
 * A server component wrapping the one client component on the page, so the
 * service list and the firm name cross the boundary as props: the browser
 * receives six short strings instead of `config/content.ts` and `lib/brand.ts`.
 *
 * ── What was removed, and why ──────────────────────────────────────────────
 * The left rail carried the first two engagement steps. `HowWeWork` renders all
 * four of them further down the same page, so it was the same content twice on
 * one scroll, and the second copy made the rail compete with the form beside it.
 * The form is the primary element on this page; the rail's job is to introduce
 * it and then get out of the way (CLAUDE.md §3.8b).
 *
 * ── `contactFallbacks()` ───────────────────────────────────────────────────
 * §3.8c requires that a failed send offer the visitor another route. That route
 * has to be a **real** one: with no phone and no email published (CLAUDE.md
 * §3.5) the list is empty and the failure message stops after "please try again
 * in a moment", rather than inventing a number to apologise with.
 */
export function contactFallbacks(): readonly ContactFallback[] {
  const out: ContactFallback[] = [];
  const tel = telHref();
  const mail = mailHref();

  if (tel && isPresent(brand.contact.phone)) {
    out.push({ label: vocabulary.actions.call, value: brand.contact.phone, href: tel });
  }
  if (mail && isPresent(brand.contact.email)) {
    out.push({ label: vocabulary.actions.email, value: brand.contact.email, href: mail });
  }
  return out;
}

export function EnquirySection({
  services,
  firmName,
  showNoDirectChannelsNote,
}: {
  services: readonly { slug: string; name: string }[];
  firmName: string;
  showNoDirectChannelsNote: boolean;
}) {
  return (
    <Section labelledBy="enquiry-heading" ground="muted">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="enquiry-heading"
            eyebrow="Enquiry"
            title={contactMessages.form.heading}
            lede={contactMessages.form.lede}
          />
        </div>

        <div className="lg:col-span-8">
          <EnquiryForm
            services={services}
            firmName={firmName}
            showNoDirectChannelsNote={showNoDirectChannelsNote}
            fallbacks={contactFallbacks()}
          />
        </div>
      </div>
    </Section>
  );
}
