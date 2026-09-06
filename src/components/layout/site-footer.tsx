import Link from "next/link";

import { BrandLogo } from "@/components/media/brand-logo";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { services } from "@/config/content";
import { legalNav, primaryNav } from "@/config/nav";
import { activeSocials, brand, isPresent, mailHref, telHref } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

import { Container } from "./container";

/**
 * Site footer.
 *
 * **Accordion sections on phone, columns from `md`** (§D.3 rule 6). Not a
 * cosmetic difference: four stacked 6-item link lists is ~900px of scroll a
 * phone user has to travel past to reach the disclaimer and copyright, which is
 * the part a professional site actually needs read.
 *
 * The disclaimer is rendered prominently rather than buried. §D.6 row 16: on a
 * professional-services site the disclaimer *adds* credibility — it signals the
 * firm understands the difference between information and advice.
 */

type FooterColumn = {
  id: string;
  title: string;
  links: readonly { label: string; href: string }[];
};

export function SiteFooter() {
  const tel = telHref();
  const mail = mailHref();
  const socials = activeSocials();

  const columns: FooterColumn[] = [
    { id: "firm", title: vocabulary.sections.about, links: primaryNav },
    {
      id: "services",
      title: vocabulary.sections.services,
      links: services.map((service) => ({
        label: service.name,
        href: routes.service(service.slug),
      })),
    },
    {
      id: "regulators",
      title: vocabulary.labels.regulators,
      links: brand.regulators.map((regulator) => ({
        label: regulator.name,
        href: regulator.href,
      })),
    },
    { id: "legal", title: vocabulary.labels.legal, links: legalNav },
  ];

  return (
    <footer className="border-t border-outline-variant bg-surface-container-low">
      <Container className="py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Brand block. Stays a block at every width — it is the anchor. */}
          <div className="md:col-span-4">
            <BrandLogo priority={false} className="h-12" />
            <p className="mt-4 max-w-xs text-body-medium text-on-surface-variant">
              {brand.tagline}
            </p>

            {/* The whole element, not just its rows, is conditional. An empty
                `<address>` still carries its `mt-6`, so the absent branch used
                to leave 24px of nothing under the tagline — a small version of
                exactly what CLAUDE.md §3.5 forbids: chrome for a fact the firm
                has not published. */}
            {tel || mail ? (
              <address className="mt-6 flex flex-col gap-1 text-body-medium not-italic">
                {tel ? (
                  <a
                    href={tel}
                    className="link-underline text-on-surface transition-colors hover:text-primary"
                  >
                    {brand.contact.phone}
                  </a>
                ) : null}
                {mail ? (
                  <a
                    href={mail}
                    className="link-underline break-all text-on-surface transition-colors hover:text-primary"
                  >
                    {brand.contact.email}
                  </a>
                ) : null}
              </address>
            ) : null}

            {/* Opt-in only: a null href is a profile the firm does not have. */}
            {socials.length > 0 ? (
              <div className="mt-6">
                <p className="text-label-small text-on-surface-variant uppercase">
                  {vocabulary.labels.followUs}
                </p>
                <ul className="mt-2 flex flex-wrap gap-4">
                  {socials.map((social) => (
                    <li key={social.platform}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex min-h-11 items-center text-body-medium text-on-surface-variant transition-colors hover:text-primary"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Phone: one accordion. `md`: four columns, no accordion chrome. */}
          <div className="md:col-span-8">
            <div className="md:hidden">
              <Accordion>
                {columns.map((column) => (
                  /* The last item drops its rule: the disclaimer block below
                     opens with its own `border-t`, and the two together drew a
                     pair of parallel hairlines 40px apart on a phone, which
                     reads as a stray separator rather than as a section break. */
                  <AccordionItem
                    key={column.id}
                    value={column.id}
                    className="last:border-b-0"
                  >
                    <AccordionTrigger>{column.title}</AccordionTrigger>
                    <AccordionPanel>
                      <ul className="flex flex-col gap-1">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <FooterLink href={link.href} label={link.label} />
                          </li>
                        ))}
                      </ul>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="hidden gap-8 md:grid md:grid-cols-4">
              {columns.map((column) => (
                <nav key={column.id} aria-label={column.title}>
                  <p className="text-label-small text-on-surface-variant uppercase">
                    {column.title}
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink href={link.href} label={link.label} />
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer + copyright. */}
        <div className="mt-10 border-t border-outline-variant pt-6">
          <p className="max-w-[70ch] text-body-small text-on-surface-variant">
            <span className="font-[family-name:var(--font-display)] text-on-surface">
              {vocabulary.labels.disclaimer}.{" "}
            </span>
            {brand.disclaimer}
          </p>
          <div className="mt-4 flex flex-col gap-1 text-body-small text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>{vocabulary.legal.copyright(new Date().getFullYear(), brand.legalName)}</p>
            <RegistrationLine />
          </div>
        </div>
      </Container>
    </footer>
  );
}

/**
 * ICAN firm registration number and IRD PAN.
 *
 * Printed as a pair in the footer because that is the Nepali convention, and
 * because the pair is what lets a visitor check the practice against two
 * independent public registers — a materially stronger signal than the words
 * "ICAN-registered" with no number, which is what most firm sites settle for.
 *
 * Both are `null` until the firm confirms them, and the line disappears entirely
 * rather than printing a label with nothing after it (CLAUDE.md §3.5).
 */
function RegistrationLine() {
  const parts: string[] = [];
  if (isPresent(brand.icanRegistrationNumber)) {
    parts.push(`${vocabulary.labels.icanRegistration} ${brand.icanRegistrationNumber}`);
  }
  if (isPresent(brand.panNumber)) {
    parts.push(`${vocabulary.labels.pan} ${brand.panNumber}`);
  }
  if (parts.length === 0) return null;

  return <p className="tabular">{parts.join(" · ")}</p>;
}

/** External links get `rel`; internal ones get the client-side router. */
function FooterLink({ href, label }: { href: string; label: string }) {
  const external = /^https?:\/\//.test(href);
  const className =
    "link-underline inline-flex min-h-11 items-center text-body-medium text-on-surface-variant transition-colors hover:text-primary md:min-h-0";

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
