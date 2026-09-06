import { Mail, MapPin, Phone } from "lucide-react";

import { Section } from "@/components/layout/section";
import { AssetImage } from "@/components/media/asset-image";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { assets } from "@/lib/assets";
import { brand, type Office } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Offices (§D.6 row 14): physical presence is a trust signal, and it feeds the
 * `LocalBusiness` JSON-LD nodes built in `lib/seo.ts`.
 *
 * **Renders nothing when the firm has published no address.** An invented
 * address is the most actionable false claim on this list — a visitor can get
 * in a taxi and go there. The same absence propagates to the structured data:
 * `officesJsonLd()` returns an empty array, so the site makes no location claim
 * to a search engine either. That consistency is the point; a page and its
 * schema disagreeing is how sites get manual actions.
 */
export function Offices({ offices = brand.offices }: { offices?: readonly Office[] }) {
  if (offices.length === 0) return null;

  return (
    <Section id="offices" labelledBy="offices-heading" ground="muted">
      <SectionHeading
        id="offices-heading"
        eyebrow={vocabulary.sections.offices}
        title="Our offices"
        lede="Where to find us, and who answers the phone."
      />

      <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => (
          <li key={office.id} className="rise flex flex-col gap-4">
            <AssetImage
              asset={assets.officeExterior}
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
            />

            <div>
              <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-title-large text-on-surface">
                {office.name}
                {office.isPrimary ? <Badge variant="primary">Head office</Badge> : null}
              </h3>

              <address className="mt-2 flex flex-col gap-2 text-body-medium text-on-surface-variant not-italic">
                <span className="flex gap-2">
                  <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
                  <span>
                    {office.street}
                    <br />
                    {[office.city, office.region, office.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>

                {office.phone ? (
                  <a
                    href={`tel:${office.phone.replace(/[^\d+]/g, "")}`}
                    className="flex min-h-11 items-center gap-2 hover:text-primary"
                  >
                    <Phone aria-hidden className="size-4 shrink-0" />
                    {office.phone}
                  </a>
                ) : null}

                {office.email ? (
                  <a
                    href={`mailto:${office.email}`}
                    className="flex min-h-11 items-center gap-2 break-all hover:text-primary"
                  >
                    <Mail aria-hidden className="size-4 shrink-0" />
                    {office.email}
                  </a>
                ) : null}
              </address>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
