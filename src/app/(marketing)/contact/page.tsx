import { HowWeWork } from "@/components/sections/how-we-work";
import { Offices } from "@/components/sections/offices";
import { JsonLd } from "@/components/seo/json-ld";
import { ContactIntro } from "@/features/contact/components/contact-intro";
import { hasDirectChannel } from "@/features/contact/components/contact-methods";
import { EnquirySection } from "@/features/contact/components/enquiry-section";
import { listServiceOptions } from "@/features/services/service";
import { getSiteSettings } from "@/features/settings/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";
import { vocabulary } from "@/lib/vocabulary";

import type { Metadata } from "next";

/**
 * `/contact`.
 *
 * Structure follows what ARCHITECTURE.md §A.5 found on the reference sites —
 * contact-method cards → enquiry form → offices — with the booking widget
 * deliberately absent: which scheduler the firm uses is still an open product
 * question (§P.3), and an embedded third-party widget also changes the CSP.
 *
 * ── Honest degradation, twice over ──────────────────────────────────────────
 * `getSiteSettings()` returns `null` when the API is unreachable, so the office
 * list falls back to `brand.offices` — which is itself empty. An outage
 * therefore degrades to "no offices published", never to invented offices. And
 * with no phone, WhatsApp or email published either, the method cards render
 * nothing and the form is told to say plainly that it is the way in. Neither
 * branch fabricates a channel to fill a hole.
 *
 * Ground rhythm: surface → muted → surface → muted, and it is checked against
 * what actually renders. `Offices` returns `null` while the firm has published
 * no address, which is why it sits last: with it absent the page still
 * alternates correctly instead of ending on two identical grounds.
 */
export const revalidate = 300;

const TITLE = "Contact";
const DESCRIPTION =
  "Send an enquiry to a chartered accountancy practice in Nepal. Tell us what the entity is and what is due, and we will tell you what the work involves.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.contact() },
  openGraph: {
    type: "website",
    url: routes.contact(),
    title: `${TITLE} — ${brand.name}`,
    description: DESCRIPTION,
  },
};

export default async function ContactPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    listServiceOptions(),
  ]);
  const offices = settings?.offices ?? brand.offices;

  return (
    <>
      {/* `AccountingService`, `LocalBusiness` and the office nodes are emitted
          once by the root layout, so this page adds only the trail. Repeating
          the organisation here would put two copies of the same `@id` in the
          graph for no gain. */}
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: vocabulary.nav.contact, path: routes.contact() },
          ]),
        ]}
      />

      <ContactIntro offices={offices} />
      <EnquirySection
        services={services}
        firmName={brand.name}
        showNoDirectChannelsNote={!hasDirectChannel()}
      />
      <HowWeWork />
      <Offices offices={offices} />
    </>
  );
}
